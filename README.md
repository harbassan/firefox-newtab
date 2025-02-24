## firefox new tab
custom new tab for firefox that shows yours bookmarks (organised in folders) and has some useful keyboard shortcuts.

alters the ui slightly when using duck duck go's built in search [bangs](https://duckduckgo.com/bangs).

### shortcuts
- `/` [focus into searchbar]
- `!` `'` [focus into searchbar and start a bang]
- `.` [open all in current folder] 
- `<sc>` [open from current folder] 
- ` <sc>` [open from all folders]
- `;<sc>` [switch folder] 
- `Esc` [clear all input and unfocus all]

where `<sc>` refers to the first characters needed to uniquely describe an item in the relevant context.

### setup
needs a .env with key FIREFOX_PF_PATH for getting bookmark info and NEWS_API_KEY for the headlines, via https://newsapi.org/. You can also specify a PORT key, the default port being 3000.

---
![main](/imgs/main.png)

![bang](/imgs/bang.png)
