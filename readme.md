# Borg Backup Repository Explorer

<img src="./images/ss1.png" width=650 />

This repository contains a personal project, a simple GUI explorer for Borg repositories.

This project is is a **⚠️Work In Progress⚠️**, and it is not guaranteed to be completed or maintained.

This project was created with assistance from [ChatGPT](https://chat.openai.com/chat) and [Copilot](https://copilot.github.com).

## Current State

Still in early development, functionality is very limited. It's also very "programmer art" and not at all intuitive to use. You can blame the AI's for what it looks like, I have no taste for HTML and CSS 😊. The poor UX is definitely my fault, though. 

### Implemented
* Browsing for a repository directory.
* Verifying a passphrase is correct for a Borg repository.
* Listing archives contained within a Borg repository.
* Very rudimentary listing of files contained within an archive.

### Not Implemented
* Viewing or extracting files from an archive.

## Why?

* I use Borg to backup my machines and have started using it to manage my old computer backup archives.
* Sometimes, I like to browse these archives for files and extract them for interest/nostalgia's sake.
* My current main machine is an M1 MacBook Pro.
* MacOS cannot easily mount FUSE filesystems, so I have no easy way to browse these archives directly from my Mac.
  * That's not to say FUSE doesn't work on Mac. It does, but there's hassle involved.
  * Hassle which you need to repeat after every major system update, it appears!
* My current options for browsing an archive are:
  * Install FUSE on Mac to mount the repository
    * I don't want to have to repeat installation after every update. (I still haven't updated to Ventura yet, either!)
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
<img src="./images/ss2.png" width=650 />
<img src="./images/ss3.png" width=650 />