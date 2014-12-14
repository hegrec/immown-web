<h2>Frontfacing Immodispo Web Platform</h2>

This repo contains the immodispo website




**installation:**

1. First install the immodispo-vm (<a href="https://github.com/hegrec/immodispo-vm">https://github.com/hegrec/immodispo-vm</a>)


Your folder structure should look like this:
<br><br>
<div>/immodispo/</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;/immodispo-vm/</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Vagrantfile and other files are here</div>



1. Clone this repo (immodispo-web) under the /immodispo/ folder
2. On your host machine, navigate to the immodispo-web folder and run <i>npm install</i> (This may require sudo)
1. Navigate to your immodispo-vm folder on your host machine
2. <i>vagrant ssh</i> to connect to the VM
3. <i>cd /vagrant/immodispo-web<i>
4. <i>node index.js</i>
5. Open <a href="http://localhost:3000">http://localhost:3000</a> and you should be at the website