using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Gmc.Cloud.Infrastructure.Core;
using Gmc.Cloud.Infrastructure.Core.Infrastructure.Core.Utils;
using Gmc.Cloud.Infrastructure.Core.Logs;
using Gmc.Cloud.Infrastructure.Host;
using Gmc.Cloud.Infrastructure.Utils;
using Gmc.Cloud.xxxxx.ExportChangeSet.Data;
using Gmc.Cloud.xxxxx.ImportChangeSet.Data;
using Gmc.Cloud.xxxxx.Handlers.Uploaders;
using Gmc.Cloud.xxxxx.Utils;
using static Gmc.Cloud.xxxxx.Utils.ServiceInstanceUtils;

namespace Gmc.Cloud.xxxxx.ImportChangeSet;

public interface IChangeSetImporter
{
    public ValueTask<ImportChangeSetResult> Import(ulong companyId, Stream dataStream);
}

public class ChangeSetImporter(
    IVersionProvider versionProvider,
    IBlobStorage blobStorage,
    IFileOperator fileOperator
) : IChangeSetImporter
{
    static readonly ILogger Log = LogFactory.Create();
    public async ValueTask<ImportChangeSetResult> Import(ulong companyId, Stream dataStream)
    {
        Action? cleanupAction = null;
        try
        {
            var workDirPath = fileOperator.CreateDirectory(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString())).FullName;
            cleanupAction = () => Cleanup(workDirPath);
            var extractedDirPath = await ExtractZipArchive(dataStream, workDirPath);
            var exportMetadata = ReadMetadata(extractedDirPath);

            if (!IsCloudVersionCompatible(exportMetadata.FirstCompatibleVersion))
            {
                throw new ImportChangeSetException(xxxxxErrors.IncompatibleCloudVersion);
            }

            var blobId = await UploadChangeSetToBlobStorage(companyId, extractedDirPath);
            cleanupAction();
            return ImportChangeSetResult.Success(exportMetadata, blobId.ToString());
        }
        catch (ImportChangeSetException e)
        {
            cleanupAction?.Invoke();
            return ImportChangeSetResult.Error(e.ErrorMsg);
        }
        catch (Exception e) when (e is InvalidDataException or ArgumentNullException or ArgumentException)
        {
            // handling for exceptions thrown by ZipFile extraction process
            cleanupAction?.Invoke();
            return ImportChangeSetResult.Error(xxxxxErrors.FileStructureInvalid);
        }
        catch (Exception)
        {
            cleanupAction?.Invoke();
            throw;
        }
    }

    async ValueTask<Guid> UploadChangeSetToBlobStorage(ulong companyId, string extractedDirPath)
    {
        var changeSetBlobPath = Directory.GetFiles(extractedDirPath).SingleOrDefault(path => path.EndsWith(".zip"));
        if (changeSetBlobPath is null)
        {
            throw new ImportChangeSetException(xxxxxErrors.FileStructureInvalid);
        }

        var blobId = Guid.NewGuid();
        var blobLocation = UploadHelper.GenerateChangeSetBlobLocation(companyId, blobId);
        await using var fileStream = File.OpenRead(changeSetBlobPath);
        await blobStorage.UploadAsync(blobLocation, fileStream, CancellationContext.CancellationToken);
        return blobId;
    }

    static ExportMetadata ReadMetadata(string extractedDirPath)
    {
        var metadataFilePath = Path.Combine(extractedDirPath, ExportMetadata.ExportMetadataFileName);

        if (!File.Exists(metadataFilePath))
        {
            throw new ImportChangeSetException(xxxxxErrors.FileStructureInvalid);
        }

        using var fileStream = File.OpenRead(metadataFilePath);
        return JsonSerialization.DeserializeObject<ExportMetadata>(fileStream, Encoding.UTF8);
    }

    static async ValueTask<string> ExtractZipArchive(Stream zipDataStream, string targetLocation)
    {
        var zipFileName = "data.echs";
        var zipFilePath = Path.Combine(targetLocation, zipFileName);
        await using (var fileStream = File.Create(zipFilePath))
        {
            // Copy the stream content to the file
            await zipDataStream.CopyToAsync(fileStream);
        }

        var extractedDirPath = Path.Combine(targetLocation, "extracted");
        ZipFile.ExtractToDirectory(zipFilePath, extractedDirPath);
        return extractedDirPath;
    }

    void Cleanup(string workdir)
    {
        try
        {
            Directory.Delete(workdir, true);
        }
        catch (IOException ex)
        {
            Log.Warn($"Failed to delete temp directory after change set import: {ex.Message}");
        }
    }

    bool IsCloudVersionCompatible(string firstCompatibleVersion)
    {
        if (firstCompatibleVersion.IsNullOrEmpty())
        {
            return false;
        }

        var chsOriginVersion = FormatMajorVersion(firstCompatibleVersion);
        var thisVersion = FormatMajorVersion(versionProvider.GetApplicationVersion());
        return chsOriginVersion.IsOlderOrEqualTo(thisVersion);
    }

    public class ImportChangeSetException(string errorMessage) : Exception
    {
        public string ErrorMsg { get; } = errorMessage;
    }
}
