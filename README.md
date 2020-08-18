feeds-dapp
========================

## 1. Introduction

If you are looking for an update-to-date social style dApp with the following characteristics:

- Sign-in with decentralised DID
- You own all your social data from your feeds
- Multiple connections to service/node providers

***Congratulations*** !!!  This is the one and I hope you love it.

## 2. Features

An initial **technical preview version v1.0.0** has been released with the following basic features:

- [x] Sign-in with DID

- [x] Create/delete your own feeds source/node

- [x] Add/remove 3rd-parties' feeds source/node

- [x] Create new public feeds

- [x] Follow/unfollow feeds

- [x] Publish post in your feed

- [x] Publish comments on post

- [x] Like/unlike posts or comments

- [x] Pushed posts/comments to dApp

- [x] Notifications

- [x] Tip for feeds

- [x] Post content with images

- [ ] Post short video less than 30seconds [ **UPCOMING**]

- [ ] Private/Payment feeds [ **IN PLAN** ]

- [ ] Sharing of feeds/posts [ **IN PLAN** ]

- [ ] Pay to see valuable posts [ **IN PLAN** ]

Based on that,  we will keep improving not only for experience of UI/UX, but the new added-value features described as **IN PLAN**.

Any advices about new features or improvements would be appreciated to put forward as **Issues** to this repository.

## 3. Run dApp in developer mode

### trinity-cli

Developers should have **trinity-cli** command tool installed on developing device at first.  Otherwise, you have to install **trinity-cli** with command below:

```
sudo npm install -g @elastosfoundation/trinity-cli --unsafe-perm
```

**notice:**  Please see details in [developer.elastos.org](https://developer.elastos.org/build/elastos/setup/environment_setup/)

### elastOS

Developers should have latest version of **elastOS** application installed on mobile device of **Android** or **iOS** platform. Please check the details in the repository of [**Elastos.Trinity**](https://github.com/elastos/Elastos.Trinity)

### Run dApp

Then **clone** the repository with the commands:

```
git clone https://github.com/elastos-trinity/feeds-dapp
cd feeds-dapp
```

With **trinity-cli**, input the command to launch **feeds** dApp on your **Android** device with the help of **elastOS** application when you have **Android** connected.

```
trinity-cli run -p android
```

Or to launch **feeds** dApp on **iOS** device

```
triniyt-cli run -p iOS
```

## 4. Acknowledgments

A sincere thank to the all team and projects we are relying on, especially for the following projects:
- [trinity elastOS](https://github.com/elastos/Elastos.Trinity)
- [ionic-team](https://github.com/ionic-team/ionic-framework.git)
- [apache cordova](https://github.com/apache/cordova.git)

## 5. License

This project is licensed under the term of **GPLv3**
