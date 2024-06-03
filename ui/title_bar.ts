import { circuitName, effectAndInit } from "../bsim.js";
import { World } from "../engine/ecs.js";
import { JSML, Ui } from "../jsml/jsml.js";
import { awaitIntoSignal, directEffect, signals } from "../jsml/signals.js";
import { I18N, LANG } from "../lang.js";
import * as icons from "../icons.js";
import { showSettings } from "./settings.js";
import { loadCircuitFromFile, saveCircuitAsFileLink, saveCircuitAsLink } from "../persistency.js";
import { Camera2d, Vec2 } from "../engine/engine.js";
import { copyLink, isAncestorOf, loadingSpinner, selectOptions, uiComponentsPlugin } from "./components.js";
import { Circuit, deleteAllBlocks, isEmpty } from "../blocks.js";

export function titleBarPlugin(world: World, camera: Camera2d) {
    world.plugin(uiComponentsPlugin);

    const titleBarTextEditSizeTest = document.getElementById("title-bar-text-edit") as HTMLElement;

    let tempName = circuitName.get();
    const editingName = signals.value(false);
    const editFieldWidth = signals.computed(() => {
        titleBarTextEditSizeTest.innerText = tempName;
        return `${titleBarTextEditSizeTest.offsetWidth}px`;
    });

    let previousLang = LANG.get();
    effectAndInit(LANG, () => {
        if (circuitName.get() === I18N[previousLang].UNNAMED_CIRCUIT) {
            circuitName.set(I18N[LANG.get()].UNNAMED_CIRCUIT);
            tempName = circuitName.get();
        }
        previousLang = LANG.get();
    });

    const circuitNameIsNull = signals.computed(() => circuitName.get() === null);

    const titleBar = new JSML(document.getElementById("title-bar") as HTMLElement);
    let renameField: HTMLElement | null = null;
    let editBtn: HTMLElement | null = null;

    const showFileUpload = signals.value(false);
    const fileUploadState = signals.value<"input" | "clearWarning">("input");
    const fileUploadLoading = signals.value(false);
    const fileUploadError = signals.value(false);
    let uploadFile: null | File = null;
    
    const showFileDownload = signals.value(false);
    const circuitLink = signals.value("");
    const downloadLink = signals.value("");
    const fileName = signals.value(circuitName.get());
    directEffect(circuitName, () => {
        fileName.set(circuitName.get());
    });
    const fileDownloadFormat = signals.value<"binary" | "json">("binary");

    let buttonsDiv: EventTarget | null;

    function genDownloadLink() {
        downloadLink.set(saveCircuitAsFileLink(Circuit.saveCircuit(world), fileDownloadFormat.get()));
    }
    directEffect(showFileDownload, genDownloadLink);
    directEffect(fileDownloadFormat, genDownloadLink);

    titleBar.ui(ui => {
        ui.h1(ui => {
            ui.text(I18N[LANG.get()].NAME);
        });
        if (!circuitNameIsNull.get()) {
            ui.p(ui => ui.text("/")).class("slash");
            ui.div(ui => {
                if (!editingName.get()) {
                    ui.p(ui => ui.text(() => `${circuitName.get()}`)).class("sub-section");
                } else {
                    editFieldWidth.setDirty();
                    ui.tag("input", () => {})
                        .attribute("type", "text")
                        .attribute("value", tempName)
                        .class("rename-input")
                        .style("width", editFieldWidth)
                        .then(e => {
                            renameField = e;
                            e.focus();
                        })
                        .addEventListener("input", e => {
                            tempName = (e.target as HTMLInputElement).value;
                            editFieldWidth.setDirty();
                        })
                        .addEventListener("blur", e => {
                            if (e.target === renameField && e.relatedTarget !== editBtn) {
                                editingName.set(false);
                                circuitName.set(tempName);
                            }
                        })
                        .addEventListener("keypress", e => {
                            if (e.key === "Enter") {
                                (e.target as HTMLElement).blur();
                            }
                        });
                }
            });
            ui.button(ui => {
                ui.html(icons.edit)
                    .class("icon")
                    .classIf("focus", editingName);
            })
                .class("icon-btn")
                .click(() => {
                    editingName.set(!editingName.get());
                    if (editingName.get()) {
                        tempName = circuitName.get();
                    } else {
                        circuitName.set(tempName);
                    }
                })
                .then(e => {
                    editBtn = e;
                });
            ui.div(_ => {}).class("side-seperator");
            ui.div(ui => {
                ui.button(ui => {
                    ui.html(icons.upload).class("icon").classIf("focus", showFileUpload);
                })
                    .class("icon-btn")
                    .click(_ => {
                        if (!fileUploadLoading.get()) {
                            showFileUpload.set(!showFileUpload.get());
                            fileUploadState.set("input");
                            fileUploadError.set(false);
                        }
                    });
                ui.button(ui => {
                    ui.html(icons.save).class("icon").classIf("focus", showFileDownload);
                })
                    .class("icon-btn")
                    .click(_ => {
                        showFileDownload.set(!showFileDownload.get());
                    });
                ui.button(ui => {
                    ui.html(icons.settings).class("icon");
                })
                    .class("icon-btn")
                    .click(_ => {
                        showSettings.set(true);
                    });
                
                ui.div(ui => {
                    ui.h3(ui => ui.text(I18N[LANG.get()].POPUPS.OPEN_FILE));
                    fileUploadPopup(ui);
                })
                    .class("popup")
                    .classIf("show", showFileUpload);
                
                ui.div(ui => {
                    ui.h3(ui => ui.text(I18N[LANG.get()].POPUPS.DOWNLOAD_AND_SHARE));
                    fileDownloadPopup(ui);
                })
                    .class("popup")
                    .classIf("show", showFileDownload);
            })
                .class("buttons")
                .then(e => buttonsDiv = e);
        }
    });

    function fileUploadPopup(ui: Ui) {
        switch (fileUploadState.get()) {
            case "input":
                if (fileUploadLoading.get() && !fileUploadError.get()) {
                    loadingSpinner(ui);
                } else {
                    ui.tag("input", _ => {})
                    .attribute("type", "file")
                    .addEventListener("change", async e => {
                        if (isEmpty(world)) {
                            uploadFile = ((e.target as HTMLInputElement).files as FileList)[0];
                            fileUploadLoading.set(true);
                            fileUploadError.set(false);
                            try {
                                const c = await loadCircuitFromFile(uploadFile);
                                c.load(world, camera, new Vec2(0));
                                fileUploadLoading.set(false);
                                showFileUpload.set(false);
                            } catch {
                                console.log("error");
                                fileUploadError.set(true);
                                fileUploadLoading.set(false);
                            }
                        } else {
                            fileUploadState.set("clearWarning");
                        }
                    });
                    if (fileUploadError.get()) {
                        ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.ERROR_WHILE_UPLOADING))
                            .class("error");
                    }
                }
                return;
            case "clearWarning":
                ui.p(ui => {
                    ui.text(I18N[LANG.get()].POPUPS.CLEAR_WARING);
                }).class("warning");
                ui.div(ui => {
                    ui.button(ui => ui.text(I18N[LANG.get()].POPUPS.CANCEL))
                        .click(_ => {
                            showFileUpload.set(false);
                        }).class("primary");
                    ui.button(ui => {
                        if (fileUploadLoading.get()) {
                            loadingSpinner(ui);
                        } else {
                            ui.text(I18N[LANG.get()].POPUPS.CLEAR_AND_CONTINUE);
                        }
                    })
                        .click(async _ => {
                            fileUploadLoading.set(true);
                            fileUploadError.set(false);
                            try {
                                const c = await loadCircuitFromFile(uploadFile as File);
                                deleteAllBlocks(world);
                                c.load(world, camera, new Vec2(0));
                                fileUploadLoading.set(false);
                                showFileUpload.set(false);
                            } catch {
                                fileUploadError.set(true);
                                fileUploadLoading.set(false);
                            }
                        });
                }).class("popup-buttons");
                if (fileUploadError.get()) {
                    ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.ERROR_WHILE_UPLOADING))
                        .class("error");
                }
                return;
        }
    }

    function fileDownloadPopup(ui: Ui) {
        showFileDownload.get();
        ui.tag("hr", _ => {});
        ui.h4(ui => ui.text(I18N[LANG.get()].POPUPS.COPY_LINK));
        awaitIntoSignal(circuitLink, (async () => (await saveCircuitAsLink(Circuit.saveCircuit(world))).href)());
        copyLink(ui, circuitLink);
        ui.tag("hr", _ => {});
        ui.h4(ui => ui.text(I18N[LANG.get()].POPUPS.DOWNLOAD));
        ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.FORMAT)).class("info");
        selectOptions(ui, {
            binary: ui => {
                ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.BINARY));
                ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.BINARY_NOTE)).class("info");
            },
            json: ui => {
                ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.JSON));
                ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.JSON_NOTE)).class("info");
            },
        }, fileDownloadFormat);
        ui.p(ui => ui.text(I18N[LANG.get()].POPUPS.FILE_NAME)).class("info");
        ui.div(ui => {
            ui.tag("input", _ => {})
                .attribute("type", "text")
                .attribute("value", fileName.value)
                .addEventListener("input", e => {
                    fileName.set((e.target as HTMLInputElement).value);
                });
            ui.p(ui => {
                switch (fileDownloadFormat.get()) {
                    case "binary":
                        ui.text(".bsim");
                        return;
                    case "json":
                        ui.text(".bsim.json");
                        return;
                }
            }).class("file-extension")
        }).class("file-name");
        ui.div(_ => {}).style("height", ".2rem");
        ui.div(ui => {
            ui.tag("a", ui => ui.text(I18N[LANG.get()].POPUPS.DOWNLOAD))
                .class("button")
                .class("primary")
                .attribute("href", downloadLink.get())
                .attribute("download", fileName.get() + (fileDownloadFormat.get() === "binary" ? ".bsim" : ".bsim.json"));
        }).class("primary-button-centerer");
    }

    addEventListener("click", e => {
        if (!(isAncestorOf(e.target as HTMLElement, buttonsDiv as HTMLElement)) && !fileUploadLoading.get()) {
            if (showFileDownload.get()) {
                showFileDownload.set(false);
            } else {
                showFileUpload.set(false);
            }
        }
    });
}
