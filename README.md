# Get Notion Data
> This will help you to get **PUBLIC** Notion page's data.

## Installation
```sh
$ npm i -S get-notion-data
```

## Usage
```js
const getNotionData = require('.');

getNotionData(/* YOUR NOTION PAGE ID */).then((data) => {
  console.log(JSON.stringify(data, null, 2));
});
```

<div>First of all, you should make page public. Then you can get the ID of the page.</div>
<div>If the public Notion page's URL is https://www.notion.so/Personal-Home-db45cd2e7c694c3493c97f2376ab184a</div>
<div>You need to copy `db45cd2e7c694c3493c97f2376ab184a`. and make it to follow below format.</div>

```
XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
X{8}-X{4}-X{4}-X{4}-X{12}
```

Before run the source, you should set up the timezone like this. Default timezone is Asiz/Seoul.
```sh
$ TZ=Asia/Seoul
```
