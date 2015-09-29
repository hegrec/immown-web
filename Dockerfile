FROM    centos:centos6

RUN curl --silent --location https://rpm.nodesource.com/setup | bash -
RUN yum install -y nodejs
COPY . /code
RUN cd /code ; npm install
EXPOSE 3000

CMD ["node", "/code/index.js"]
