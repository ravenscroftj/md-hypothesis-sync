# VSCode Hypothes.is Markdown Sync Plugin

This extension allows you to download your hypothes.is annotations and store them in your markdown-based knowledge vault.

![screen recording](image/../images/screenrecording.gif)


## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.


## Extension Settings


### General Extension Settings

This extension contributes the following settings:

* `hypothesis.username`: The hypothesis username of the person whose notes you want to sync
* `hypothesis.filePattern`: The file naming convention that the generated markdown files should use. The plugin will substitute `%DOCSTUB%` for a stub representing the URL of the document being synchronised.
* `hypothesis.fileDir` if set then the plugin will store the generated markdown files in this subdirectory of your workspace folder.

### Dendron Integration

* `hypothesis.dendron.callDoctor` if set then the plugin will call the [dendron doctor](https://wiki.dendron.so/notes/ZeC74FYVECsf9bpyngVMU/#fixfrontmatter)_to have it automatically add relevant metadata (e.g. id, created, updated attributes) to any newly created notes.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initial release of the extension and initial feature set:
 - Set your hypothesis username
 - Use the `Sync Hypothesis Annotations` command to download all hypothesis annotations and store them as markdown notes.

