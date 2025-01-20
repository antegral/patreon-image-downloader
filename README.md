# Patreon Media(image) Downloader

> **Disclaimer**
> We are not responsible for any (legal) problems arising from using this program or library.

## how get my `CLIENT_SESSION_ID`?
install [EditThisCookie Extension](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg). 
login your [patreon account](https://www.patreon.com/home).
open EditThisCookie Extension menu.
find `session_id` menu. and click.
displayed value is your `CLIENT_SESSION_ID`.

## library install
    git clone https://github.com/antegral/patreon-image-downloader.git
    cd patreon-image-downloader
    pnpm install

## Start application
> **Warning!**
> Before using cli download, please edit filename config.example.env to config.env.
> and, you must edit config.env.

    `pnpm start`
or
    `pnpm run start`
or 
    `ts-node ./index.ts` (It is recommended to run as npx or pnpx.)

## Dump metadata
### using cli
insert `saveMetadata(metadata)` between Promise Callback in `imgWorker.getDownloadableContentList()` of `index.ts`
it's already commented out in the appropriate places, you just need to uncomment it.

(see `index.ts` for more details)
### using library
call `includedWorker.writeFile(patreonDownloadableContent[])`