import * as b from "bobril";
import { t } from "bobril-g11n";
import { Modal, ModalSize } from "helpers--fluid-transition-modal";
import { Button, ButtonType } from "helpers--fluid-transition-button";
import { Label } from "xxxxx--label";
import { LMainContent, PaddingSize } from "xxxxx--l-main-content";
import {
    NotificationMessage,
    Type as NotificationMessageType,
    Paddings as NotificationMessagePaddings,
    Size as NotificationMessageSize,
} from "xxxxx--notification-message";
import { Loader } from "xxxxx/loader";
import { Size as LoaderSize, LabelPosition } from "xxxxx--loader";
import { AddSampleModalContentStore } from "./addSampleModalContentStore";

export const AddSampleContentModal = ({ fileName }: { fileName: string }): b.IBobrilNode => {
    const store = b.useStore(() => new AddSampleModalContentStore());

    return (
        <Modal
            headerSettings={{
                title: t("Add Sample Content"),
            }}
            customWidth={600}
            useAddRoot
            autoHeight
            size={ModalSize.Default}
            onClose={() => store.hide()}
            footerRightButtons={[
                <Loader
                    key="processing-loader"
                    visible={store.isImporting}
                    isFullScreen={false}
                    label={t("Processing ...")}
                    labelPosition={LabelPosition.Right}
                    size={LoaderSize.Default}
                />,
                <Button label={t("Add & Redirect")} onClick={() => void store.addSample(fileName)} isDisabled={store.isImporting} />,
                <Button type={ButtonType.Secondary} label={t("Cancel")} onClick={() => store.hide()} />,
            ]}
        >
            <Label isSimple>
                {t(
                    "The change set will be ready for deployment in the xxxxx section, where you can preview it before the final approval and deployment."
                )}
            </Label>
            <LMainContent paddingSettings={{ top: PaddingSize.Medium }}>
                <NotificationMessage
                    mainContent={t("Do you really want to add the change set with sample content?")}
                    type={NotificationMessageType.Warning}
                    size={NotificationMessageSize.Large}
                    paddings={NotificationMessagePaddings.None}
                />
            </LMainContent>
        </Modal>
    );
};

AddSampleContentModal.id = "add-sample-dialog";
