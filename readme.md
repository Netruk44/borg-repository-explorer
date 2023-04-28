# Borg Backup Repository Explorer

<img src="./images/screenshot1.png" width=650 />

This repository contains a personal project, a simple GUI explorer for Borg repositories. This project is mainly intended for MacOS where FUSE/`borg mount` isn't as easy to use as it is on Linux, though there is also a Linux build available.

This project comes with no guarantees, and may not be maintained indefinitely. However, I do personally use this to browse my own Borg repositories, so I will likely continue to make updates for as long as I use Borg.

This project was created with assistance from [ChatGPT](https://chat.openai.com/chat) and [Copilot](https://copilot.github.com).

### Download
You can find download links on the [releases](https://github.com/Netruk44/borg-repository-explorer/releases) page.

## Current State

Usability is rough, but functionally this project is mostly complete. The remaining changes are mostly usability-related, and adding support for the upcoming Borg 2.0.

Style is mainly "programmer art"-tier and likely unintuitive to use. You can blame the AI's for what it looks like, I have no taste for HTML and CSS 😊. The poor UX is definitely my fault, though. 

### Implemented
* Browsing for a repository directory.
* Verifying a passphrase is correct for a Borg repository.
* Listing archives contained within a Borg repository.
* Very rudimentary listing of files contained within an archive.
* Previewing archive contents in the explorer
  * Image previews: `.jpg .png .gif .bmp .tiff .webp`
  * Text previews: `.txt .md .sh .html .js .cs .cpp .c .h .yml .json, etc.`
* Extracting files and directories from an archive.
* Very primitive settings menu for setting borg installation path.
* SSH support
  * Support for setting '--remote-path' via settings menu.

## Why?

* I use Borg to backup my machines and have started using it to manage my old computer backup archives.
* Sometimes, I like to browse these archives for files and extract them for interest/nostalgia's sake.
* My current main machine is a MacBook Pro.
* Apple devices cannot easily mount FUSE filesystems, so I have no easy way to browse these archives directly from my Mac.
  * That's not to say FUSE doesn't work on Mac, it does. But, it's not as easy as it is on Linux.
  * Enabling system extensions like FUSE require you to modify startup security settings.
* My current options for browsing an archive are:
  * Install FUSE on Mac to mount the repository
    * I currently have no other use for FUSE on my Mac, so it would be nice if I could avoid going through the process of installing it.
  * Mount the repository on a remote machine and do some ssh magic to mount it locally to browse it with Finder.
    * Probably doable, but seems convoluted.
    * I can run borg on my Mac locally. Why do I have to involve another machine for this?
  * Use `borg list` in the terminal to browse the archives
    * By default, `list` dumps info about every file in the entire archive
    * Unless you come up with a regular expression to filter out the files & directories you don't want.
    * I don't love coming up with regular expressions on the fly inside Terminal.app?

The fun new thing to do is to make ChatGPT build your entire webapp for you. I've never used Electron before, and I have a desire to build a GUI. So, I decided to go ahead and give it a shot.

At some point, figuring out how to start a fresh conversation with ChatGPT (setting up a chat question with the required context to generate the kind of code I was looking for) was too much work, so I switched over to using Copilot instead. 

## Screenshot(s)
<img src="./images/screenshot2.png" width=650 />
<p align='center'>Listing of archives within a repository.</p>

<img src="./images/screenshot4.png" width=650 />
<p align='center'>Loading an archive</p>

<img src="./images/screenshot3.png" width=650 />
<p align='center'>Listing of files within an archive.</p>

<img src="./images/screenshot5.png" width=650 />
<p align='center'>Previewing an image within an archive.</p>

<img src="./images/screenshot7.png" width=650 />
<p align='center'>Previewing a text file within an archive.</p>

<img src="./images/screenshot6.png" width=650 />
<p align='center'>Extracting a file from an archive.</p>