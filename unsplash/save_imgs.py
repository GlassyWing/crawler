import asyncio
import os
import time
from pathlib import Path

import aiohttp

from unsplash.data_load import ImgLinksLoader, CSVImgLinksLoader


class ImgSaver:

    def __init__(self, save_dir, links_loader: ImgLinksLoader):
        if not os.path.exists(save_dir):
            os.mkdir(Path(save_dir).absolute())
        if not os.path.isdir(save_dir):
            raise ValueError("save_dir should be directory but is a file!")
        self.links_loader = links_loader
        self.save_dir = Path(save_dir)
        self.processed = 0
        self.all_links = [link for link in self.links_loader.links()]

    async def fetch(self, session, url, index=0):

        def process_reporter(process):
            print(f'[Process: {process:.2f} %] ')

        sleep_time = 3
        count = 0

        while count < 3:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        img_bytes = await response.read()
                        with open(self.save_dir / (str(index) + ".jpg"), 'wb') as f:
                            f.write(img_bytes)
                        self.processed += 1
                        process_reporter(self.processed * 100 / len(self.all_links))
                        break
                    else:
                        count += 1
                        if count == 3:
                            print(f"Error to fetch with url: {url}")
            except Exception as e:
                count += 1
                time.sleep(sleep_time)
                sleep_time += 5
                if count == 3:
                    print(f"Error to fetch with url: {url}")
                    print(e)

    async def save(self):

        headers = {
            'Accept': 'image/jpeg',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://unsplash.com/',
            'Connection': 'keep-alive',
            'x-unsplash-client': 'web',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36',
        }

        tasks = []

        async with aiohttp.ClientSession(headers=headers, conn_timeout=2000, read_timeout=2000) as session:
            index = 0
            for link in self.all_links:
                index += 1
                task = asyncio.ensure_future(self.fetch(session, link, index))
                tasks.append(task)
            await asyncio.gather(*tasks)


if __name__ == '__main__':
    img_saver = ImgSaver('images', CSVImgLinksLoader("../datasets/export.csv"))
    loop = asyncio.get_event_loop()
    future = asyncio.ensure_future(img_saver.save())
    loop.run_until_complete(future)
