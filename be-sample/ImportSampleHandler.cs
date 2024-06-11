using System.Linq;
using System.Threading.Tasks;
using Gmc.Cloud.Infrastructure.Core;
using Gmc.Cloud.xxxxx.ImportChangeSet.Data;

namespace Gmc.Cloud.xxxx.ImportChangeSet;

public class ImportSampleHandler(
    IChangeSetImporter importer,
    ISamplesProvider samplesProvider
) : IEventEnrichWithResponseAsync<ImportSampleRequest, ChangeSetImportFinished, ImportSampleResponse>
{
    public async ValueTask<ImportSampleResponse?> EnrichAsync(ImportSampleRequest request, ChangeSetImportFinished ev)
    {
        var latestSample = FindLatestSampleByName(request.FileName);
        await using var stream = latestSample.GetDataStream();
        var result = await importer.Import(request.CompanyId, stream);
        if (result.IsFailed())
        {
            Error(new ErrorInfo(result.ErrorMessage));
            return null;
        }

        ev.Apply(result.Metadata!, result.BlobId!);

        return new ImportSampleResponse { ChangeSetId = result.Metadata!.ChangeSetId.ToString() };
    }

    Sample FindLatestSampleByName(string fileName)
    {
        return samplesProvider.ListAvailableSamples(fileName).MaxBy(f => f.LastUpdate);
    }
}
