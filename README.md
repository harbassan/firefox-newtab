## custom new tab
custom new tab that shows and allows you to properly manage bookmarks (organised in folders) and has some useful keyboard shortcuts.

alters the ui slightly when using duck duck go's built in search [bangs](https://duckduckgo.com/bangs).

### shortcuts
- `/` [focus into searchbar]
- `!` `'` [focus into searchbar and start a bang]
- `.` [open all in current folder] 
- `<sc>` [open from current folder] 
- ` <sc>` [open from all folders]
- `;<sc>` [switch folder] 
- `Esc` [clear all input and unfocus all]
- `?c` [list all commands]
- `?s` [list all shortcuts]
- `?x` [hide help modal]

where `<sc>` refers to the first characters needed to uniquely describe an item in the relevant context.

### commands
- `touch [pathname] [url]` [create a new bookmark with the given url]
- `mkdir [title]` [create a new folder]
- `rm [pathname]` [delete a folder or bookmark]
- `mv [pathname] [pathname]` [move/rename a given bookmark or folder]
- `echo [url] [pathname]` [change the url for a given bookmark]
- `update [pathname]` [trigger a re-parse of a given bookmark's icon]
- `tip [toggle|source [csq|quote]]` [toggle/configure the statusline tip]

---
![main](/imgs/main.png)

![bang](/imgs/bang.png)
