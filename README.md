![Header](./graphics/workshop-banner.jpg 'Component Tests')

<br/>

## Master Node.js Testing 

<br/>

# Intro

This workshop is a very deep dive into writing real-world and modern backend testing. Most traditional testing guides focus on testing functions and units. In their daily routine though, developers are challenged with covering all the layers of their components - Database, APIs, MQ, metrics, 3rd parties, and more - not just logic functions. This workshop is all about writing these realistic tests in the RIGHT way. Overall, it packs 25+ best practices and 20 hands-on exercises that will open your mind to modern testing techniques. 🚀. Warning: You might fall in love with testing 💚

![Header1](/graphics/component-diagram.jpg 'Component Tests')

<br/><br/><br/>

# Let's get prepared for the workshop

A good leasson starts with a good preparation, your attention is needed here

## Prerequisites

Let's go over a short checklist to ensure that this workshop will be benefical for you. ❗️Please let us know in advance if one of the following doesn't hold true:

- You have at least 1 year of experience in JavaScript programming
- You have at least 1 year of experience in Node.js and database programming
- You know what is the purpose of testing and wrote at least few tests in the past. If not, [this is a great video to start with](https://www.youtube.com/watch?v=r9HdJ8P6GQI) - Please watch and try writing few tests
- Your computer has at least 16gb of RAM

## Preparation

As we meet in the classroom we wish to spend our precious time on interesting development challenges rather than machine setup. Make sure to prepare your machine aforehand. Should you encounter any issue - please open an issue within this repo and I'll be sure to assist shortly

❗️ If one of these steps fail - Please create an issue here at least 24 hours before the workshop

### ✅ 1 Install Node.JS 18.1

Install Node.JS version 18.1.0 [from this website](https://nodejs.org/en/) - just download and progress within the installation wizard. It's important to install this version exactly so we will all be on the same page.

Alternatively and preferably, [use nvm](https://github.com/nvm-sh/nvm), install it and then after cloning this repo run:

```
nvm install
nvm use
```

### ✅ 2 Ensure Node is installed correctly

Open your favourite terminal (Windows: command prompt) and type 'NPM verson'. The output should confirm that installed versionis indeed installed

### ✅ 3 Install Docker

Since we will use real databases using docker-compose - Docker must be installed on your machine. Visit the download site, download and install. Verify that the installation went successful by running the following hello-world container:

```
docker run hello-world
```

Please ensure that no error messages were presented during the execution

### ✅ 4 Install IDE (editor)

Any reputable editor is good. I personally use VSCode editor which is lightweight and has a very rich plugins eco-sysem. Simply visit the [downloads site](https://code.visualstudio.com/download) and choose the edition that suits your operations system. You may opt for any other editor that supports Node debugging and intellisense

### ✅ 4 Fork this repo

Use git to fork this repo into your computer. You may use the top-right corner 'Fork' button

### ✅ 5 Install dependencies

Navigate to the repository you've just cloned and install dependencies:

```
npm i
```

### ✅❗️ 6 Ensure that testing works

Run the following command and ensure that the output confirms that all the test succeeded.

```
npm run test

```

❗️If the last step failed - Open an issue with the entire error information at least 48 hours before the workshop

### ✅ 7 Polish Your JS Skills

Learning Node requires to be familiar with Javascript. Beside mastering the basic principals of JS, it's recommended to get acquaintance with the following concepts that are highly related to Node.JS:
<br/>
[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
<br/>
[Spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
<br/>
[Callbacks](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function)
<br/>
[Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

### 8 ✅ Remote workshop only: Prepare your computer for a video call

The following is needed for Zoom-based workshops only: Install the online calls software [Zoom](https://zoom.us/download), connect your camera and run a [test call](https://zoom.us/test) to ensure your equipment is ready. If Zoom is already installed on your machine, please update it to its latest version

<!--stackedit_data:
eyJoaXN0b3J5IjpbLTEwNTU3ODkwLC0xNzcxODg2MTE3LDczMj
I4MDA5M119
-->
