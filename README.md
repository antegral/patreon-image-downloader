# Patreon Media(image) Downloader

> **Disclaimer**<br/>
> We are not responsible for any (legal) problems arising from using this program or library.

## How get my `CLIENT_SESSION_ID`?
![image](https://github.com/user-attachments/assets/8ca2a63c-7949-4e59-aced-f5d4b06f2829)

1. Login your [Patreon Account](https://www.patreon.com/home).
2. Open DevTools (press F12 or Ctrl+Shift+I).
3. Click `Application` tab.
4. Click `Cookies` and `https://www.patreon.com`
5. Find `session_id` name.
6. Displayed value is your `CLIENT_SESSION_ID`.

## Library install
```bash
git clone https://github.com/antegral/patreon-image-downloader.git
cd patreon-image-downloader
pnpm install
```

## Start application
> **Warning!**<br/>
> Before using cli download, please edit filename config.example.env to config.env.
> and, you must edit config.env.

`pnpm run start`


or


`ts-node ./index.ts` (It is recommended to run as npx or pnpx.)

## Dump metadata
### Using cli
insert `saveMetadata(metadata)` between Promise Callback in `imgWorker.getDownloadableContentList()` of `index.ts`.<br/>
it's already commented out in the appropriate places, you just need to uncomment it.

(see `index.ts` for more details)
### Using library
call `includedWorker.writeFile(patreonDownloadableContent[])`
