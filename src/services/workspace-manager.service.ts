import { HOT_KEYS, TabConfig, WorkspaceProfile } from '../interfaces/interfaces';
import { PartialProfile, PlatformService, Profile, ProfilesService, SplitTabComponent } from 'tabby-core';
import { getWorkspaceConfigPath, loadWorkspaceConfig, saveWorkspaceConfig } from '../workspace-config';

import { BaseTerminalTabComponent } from 'tabby-terminal';
import { ConfigService } from 'tabby-core';
import { ElectronService } from 'tabby-electron';
import { HotkeysService } from 'tabby-core';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { delay, filter, from, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspaceManagerService {
    constructor(
        private readonly hotkeys: HotkeysService,
        private readonly toastr: ToastrService,
        private readonly config: ConfigService,
        private readonly electronService: ElectronService,
        private readonly platform: PlatformService,
        private readonly profileService: ProfilesService,
    ) {}

    /**
     * Description. Subscribes for hotkey responsible for opening new workspace profiles.
     * Displays error when selected profile does not exist. Opens default workspace configruation at startup.
     */
    init(): void {
        this.hotkeys.hotkey$.subscribe(async (hotkey) => {
            const profiles = this.loadWorkspaceProfiles();
            for (let i = 0; i < Object.keys(HOT_KEYS).length; i++) {
                if (hotkey === Object.values(HOT_KEYS)[i]) {
                    if (profiles[i]) {
                        await this.buildWorkspace(profiles[i].tabs);
                        return;
                    }
                    this.toastr.error(`Selected workspace profile does not exist`);
                }
            }
        });
        setTimeout(async () => {
            if (this.config.store.workspaceManager.runOnStartup) {
                const profiles = this.loadWorkspaceProfiles();
                await this.buildWorkspace(profiles[this.config.store.workspaceManager.defaultWorkspaceProfile].tabs);
            }
        }, 1000);
    }

    /**
     * Description. Calls function responsible for loading workspace config file and returns its content as an array of workspace profiles.
     * @returns The workspace config as an array.
     */
    loadWorkspaceProfiles(): WorkspaceProfile[] {
        return loadWorkspaceConfig(this.electronService.app);
    }

    /**
     * Description. Calls function responsible for saving workspace config file.
     * @param workspaceProfiles The workspace config
     */
    saveWorkspaceProfiles(workspaceProfiles: WorkspaceProfile[]): void {
        saveWorkspaceConfig(this.electronService.app, workspaceProfiles);
    }

    /**
     * Description. Opens directory with workspace config file
     */
    showWorkspaceConfigFile(): void {
        this.platform.showItemInFolder(getWorkspaceConfigPath(this.electronService.app));
    }

    /**
     * Description. Builds workspace based on a given configuration. Opens tabs and customises them using the given values
     * @param config The workspace config.
     */
    async buildWorkspace(config: TabConfig[]): Promise<void> {
        if (config) {
            const profiles = await this.profileService.getProfiles();
            await Promise.all(config.map((c) => this.openAndConfigureTab(profiles, c)));
        }
    }

    private async openAndConfigureTab(profiles: PartialProfile<Profile>[], config: TabConfig): Promise<void> {
        const selectedProfile = this.findTerminalProfile(profiles, config);
        const tab = (await this.profileService.openNewTabForProfile(
            selectedProfile,
        )) as BaseTerminalTabComponent<Profile>;
        this.configureTab(tab, config);
    }

    private configureTab(tab: BaseTerminalTabComponent<Profile>, config: TabConfig): void {
        tab.sessionChanged$
            .pipe(
                filter((session) => !!session),
                delay(100),
                take(1),
            )
            .subscribe(() => {
                this.customizeTab(tab, config);
                if (config.splits) {
                    const parent = tab.parent as SplitTabComponent;
                    for (const split of config.splits) {
                        // Force apply main tab title and color to splits
                        split.title = config.title;
                        split.color = config.color;
                        from(parent.splitTab(tab, split.direction))
                            .pipe(delay(100), take(1))
                            .subscribe((newTab) => {
                                this.configureTab(newTab as BaseTerminalTabComponent<Profile>, split);
                            });
                    }
                }
            });
    }

    private findTerminalProfile(profiles: PartialProfile<Profile>[], element: TabConfig): PartialProfile<Profile> {
        if (element.profile) {
            let selectedProfile: PartialProfile<Profile>;
            for (const profile of profiles) {
                if (profile.name.toLowerCase() === element.profile.toString().toLowerCase()) {
                    selectedProfile = profile;
                }
            }
            if (!selectedProfile) {
                this.toastr.error(`Could not find ${element.profile}`);
                return profiles[0];
            }
            return selectedProfile;
        }
        this.toastr.error(`Profile is not set`);
        return null;
    }

    private customizeTab(tab: BaseTerminalTabComponent<Profile>, config: TabConfig): void {
        tab.disableDynamicTitle = true;
        if (config.title) {
            tab.setTitle(config.title);
            tab.customTitle = config.title;
        }
        if (config.color) {
            tab.parent.color = config.color;
        }
        if (config.commands) {
            for (const command of config.commands) {
                tab.session.write(Buffer.from(`${command}\r`));
            }
        }
    }
}
