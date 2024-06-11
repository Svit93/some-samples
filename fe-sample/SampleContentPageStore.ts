import { observable } from "bobx";
import { xxxxxApi } from "xxxxx/xxxxxApi";
import { SampleDto } from "./sampleContentPage";
import { dialogManager } from "xxxxx/infrastructure";

const addBackendError = dialogManager.actions.addBackendError;

export class SampleContentPageStore {
    @observable samples: SampleDto[] | undefined = undefined;
    @observable serviceIsNotActive: boolean = false;

    constructor() {
        void this.loadAvailableSamples();
    }

    async loadAvailableSamples(): Promise<void> {
        try {
            const response = await xxxxxApi.queryAvailableSamples();
            this.samples = response.samples;
            this.serviceIsNotActive = response.serviceIsNotActive;
        } catch (err) {
            addBackendError(err);
        }
    }
}
