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
        setTimeout(() => {
            if (this.config.store.workspaceManager.runOnStartup) {
                const profiles = this.loadWorkspaceProfiles();
                this.buildWorkspace(profiles[this.config.store.workspaceManager.defaultWorkspaceProfile].tabs);
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
            for (const element of config) {
                const selectedProfile = this.findTerminalProfile(profiles, element);
                const tab = (await this.profileService.openNewTabForProfile(
                    selectedProfile,
                )) as BaseTerminalTabComponent<Profile>;
                this.configureTab(tab, element);
            }
        }
    }

    private configureTab(tab: BaseTerminalTabComponent<Profile>, config: TabConfig): void {
        tab.disableDynamicTitle = true;
        tab.sessionChanged$
            .pipe(
                filter((session) => !!session),
                delay(100),
                take(1),
            )
            .subscribe(() => {
                this.customizeTab(tab, config);
                if (config.split && config.secondTab) {
                    from((tab.parent as SplitTabComponent).splitTab(tab, config.split))
                        .pipe(take(1))
                        .subscribe((newTab) => {
                            config.secondTab.title = config.title;
                            config.secondTab.color = config.color;
                            this.configureTab(newTab as BaseTerminalTabComponent<Profile>, config.secondTab);
                        });
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
        return profiles[0];
    }

    private customizeTab(tab: BaseTerminalTabComponent<Profile>, element: TabConfig): void {
        if (element.title) {
            tab.setTitle(element.title);
            tab.customTitle = element.title;
        }
        if (element.color) {
            tab.parent.color = element.color;
        }
        if (element.commands) {
            for (const command of element.commands) {
                tab.session.write(Buffer.from(`${command}\r`));
            }
        }
    }
}
