import csv
from abc import ABCMeta, abstractmethod
from pathlib import Path


class ImgLinksLoader(metaclass=ABCMeta):

    @abstractmethod
    def links(self):
        pass


class CSVImgLinksLoader(ImgLinksLoader):

    def __init__(self, csvPath, skip_lines=1):
        self.path = Path(csvPath).absolute()
        self.skip_lines = skip_lines

    def links(self):
        with open(self.path, encoding="UTF-8") as f:
            f_csv = csv.reader(f)
            while self.skip_lines > 0:
                next(f_csv)
                self.skip_lines -= 1
            for row in f_csv:
                yield row[0]


if __name__ == '__main__':
    imgLinksLoader = CSVImgLinksLoader("../../datasets/export.csv")
    for row in imgLinksLoader.links():
        print(row)
