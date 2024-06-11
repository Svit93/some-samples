import { observable } from "bobx";
import { DialogStoreBase } from "xxxxx/src/infrastructure/dialogManager";
import { redirectWithPush } from "xxxxx";
import { xxxxxReception } from "xxxxx/src/urls";
import { AddSampleContentModal } from "./addSampleContentModal";
import { dialogManager } from "xxxxx/infrastructure";
import { prodaasApi } from "xxxxx/xxxxxApi";

const addBackendError = dialogManager.actions.addBackendError;

export class AddSampleModalContentStore extends DialogStoreBase {
    @observable isImporting: boolean = false;

    constructor() {
        super(AddSampleContentModal.id);
    }

    async addSample(fileName: string): Promise<void> {
        this.isImporting = true;
        try {
            const response = await xxxxxApi.importSampleRequest(fileName);
            redirectWithPush(xxxxxReception(response.changeSetId));
        } catch (err) {
            addBackendError(err);
        }
        this.isImporting = false;
    }
}
