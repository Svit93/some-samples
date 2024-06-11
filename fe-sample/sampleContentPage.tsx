import * as b from "bobril";
import { t } from "bobril-g11n";
import { LViewContentControls } from "xxxxx--l-view-content-controls";
import { HeaderText, TextStyle } from "xxxxx--header-text";
import { LMainContent, PaddingSize } from "xxxxx--l-main-content";
import { LBlock } from "xxxxx--l-block";
import { Label } from "xxxxx--label";
import { LFieldGroup } from "xxxxx--l-field-group";
import { DatePropField, StringPropField } from "xxxxx/sidePanelFields";
import { Button, Theme } from "xxxxx--button";
import { IconSVG, upload_package_svg } from "xxxxx--icon-svg";
import { ColoredIconBuilder } from "xxxxx--icon";
import { Application } from "xxxxx--color";
import { dialogManager } from "xxxxx/infrastructure";
import { AddSampleContentModal } from "./addSampleContentModal";
import { Loader } from "xxxxx/loader";
import { ServiceUnavailableEmptyState } from "xxxxx/serviceUnavailable";
import { SampleContentPageStore } from "./SampleContentPageStore";

const DialogManager = dialogManager.actions;

export const SampleContentPage = (): b.IBobrilNode => {
    const store = b.useStore(() => new SampleContentPageStore());

    return (
        <LViewContentControls
            isCombinedWithAppSidebar
            isCombinedWithAppHeader
            isFullHeight
            customHeaderHeight={70}
            headerContent={
                <LMainContent paddingSettings={{ top: PaddingSize.Default, right: PaddingSize.Default, left: PaddingSize.Default }}>
                    <HeaderText content={t("Sample Content")} textStyle={TextStyle.PageTitle} />
                </LMainContent>
            }
            bodyContent={store.samples ? <BodyContent store={store} /> : <Loader visible isFullScreen={false} />}
        />
    );
};

const BodyContent = ({ store }: { store: SampleContentPageStore }): b.IBobrilNode => {
    return store.serviceIsNotActive ? <ServiceUnavailableEmptyState /> : <SampleList store={store} />;
};

const SampleList = ({ store }: { store: SampleContentPageStore }): b.IBobrilNode => {
    return (
        <LMainContent
            paddingSettings={{
                top: PaddingSize.Default,
                right: PaddingSize.Default,
                left: PaddingSize.Default,
            }}
        >
            <LBlock width={500}>
                <Label isSimple>
                    {t("Change sets with sample content for xxxxx to your environment. Once deployed, they will be available in xxxxx.")}
                </Label>
                {store.samples?.map((sample) => (
                    <Sample sample={sample} />
                ))}
            </LBlock>
        </LMainContent>
    );
};

const Sample = ({ sample }: { sample: SampleDto }): b.IBobrilNode => {
    return (
        <>
            <LMainContent paddingSettings={{ top: PaddingSize.Default, bottom: PaddingSize.Medium }}>
                <HeaderText content={sample.title} textStyle={TextStyle.Subtitle200} />
            </LMainContent>
            <LFieldGroup>
                <StringPropField title={t("Description")} value={sample.description} />
                <DatePropField title={t("Last update")} value={sample.lastUpdate} onlyDate />
            </LFieldGroup>
            <LMainContent paddingSettings={{ top: PaddingSize.Default }}>
                <Button
                    label={t("Add Sample Content")}
                    color={Theme.None}
                    onClick={() => {
                        DialogManager.addDialog({
                            key: AddSampleContentModal.id,
                            node: <AddSampleContentModal fileName={sample.fileName} />,
                            removeOnUrlChange: true,
                        });
                    }}
                    leftIcon={<IconSVG source={ColoredIconBuilder(upload_package_svg, Application)} />}
                />
            </LMainContent>
        </>
    );
};

export type SampleDto = {
    fileName: string;
    title: string;
    description: string;
    lastUpdate: Date;
};
