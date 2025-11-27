<h1>Tabby Workspace Manager</h1>

<p>
    A <a href="https://tabby.sh/">Tabby</a> plugin that allows you to create multiple workspace profiles. Each profile has its own .yaml config in which you can customize the workspace. Additionally, it is possible to select a workspace profile that will be run at the terminal startup and setting hotkeys for first five profiles.
</p>

## Table of contents

-   [Getting Started](#getting-started)
-   [General](#general)
-   [Example workspace config](#example-workspace-config)

## Getting Started

Version 0.0.7 of the plugin is compatible with Tabby version 1.0.229.

-   Download the [latest release](https://github.com/johnny-tcy/tabby-workspace-manager/releases)
-   Locate your plugin folder by clicking Tabby's dedicated button (`%AppData%\tabby\plugins` for Windows users): <img src="https://github.com/johnny-tcy/tabby-workspace-manager/assets/121796416/985c063d-6e94-4085-858b-36c4e65d4d8d">
-   Create a `node_modules` folder in the `plugins` folder, if it does not already exist
-   Unzip the content of the downloaded release in a folder named `tabby-workspace-manager`, inside the `node_modules` folder
-   Restart Tabby

You should now have access to the workspace settings tab.

## General

<p>
The plugin adds a new tab in Tabby's settings. It is possible to add, delete and edit workspace profiles here. Additionally, you can add a default profile and enable it on the terminal startup (upper right corner). In the hotkeys tab, it is possible to set keyboard shortcuts for the first five workspace profiles.
</p>

<img src="https://github.com/johnny-tcy/tabby-workspace-manager/assets/121796416/05fd7f96-a80e-4322-982c-d3d360092755">

<p>
    The config contains a list of tabs and its attributes:
    <i>
    <ul>
        <li> Title </li>
        <li> Color </li>
        <li> Profile (by default selected the first available one) </li>
        <li> List of commands after tab is open </li>
    </ul>
    </i>
    <span style="font-size: 12px;">*all the attributes are optional</span>
</p>

<br>

## Example workspace config

Open three different tabs:

```
- title: Example Title 1
  color: '#03fccf'
  profile: CMD (clink)
  commands:
    - ls
    - cd ..
- title: Example Title 2
  color: '#fc036b'
  profile: 1
- title: Example Title 3
  color: '#302a57'
```

Open one tab vertically splitted and split horizontally the right side :

```
- title: Example of splitted tabs
  color: '#03fccf'
  profile: CMD (clink)
  commands:
    - echo "This is the top left section of the tab"
  splits:
    - direction: r
      commands:
        - echo "This is the top right section of the tab"
      splits:
        - direction: b
          commands:
            - echo "This is the bottom right section of the tab"
    - direction: b
      commands:
        - echo "This is the bottom left section of the tab"
```

Possible values for `split`:

-   `r`: split to the right
-   `b`: split to the bottom
-   `l`: split to the left
-   `t`: split to the top

Only top-level title, color and profile apply to all splitted parts of the tab.
