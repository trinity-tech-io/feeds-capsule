feeds-dapp
========================

## 1. Introduction

If you are looking for an update-to-date social style dApp with the following characteristics:

- Sign-in with decentralised DID
- You own all your social data from your feeds
- Multiple connections to service/node providers

***Congratulations*** !!!  This is the one and I hope you love it.

## 2. Features

An initial **technical preview version v2.0.9** has been released with the following basic features:

- [x] Sign-in with DID

- [x] Create/delete your own publisher account

- [x] Create public channel

- [x] Create un-public channel

- [x] Subscribe/unsubscribe channel

- [x] Publish post in your channel

- [x] Publish comments on post

- [x] Like/unlike posts or comments

- [x] Pushed posts/comments to dApp

- [x] Notifications

- [x] Tip for feeds

- [x] Post content with images

- [x] Post instant video

- [x] Connect wallet

- [x] Create collectibles

- [x] Sell collectibles

- [x] Buy collectibles

- [x] Cancel the sale of collectibles

- [x] Update the price of collectibles

- [x] Transfer of collectibles

- [x] Destroy collectibles

- [ ] Private/Payment channels [ **IN PLAN** ]

- [ ] Sharing of channels/posts [ **IN PLAN** ]

- [ ] Pay to see valuable posts [ **IN PLAN** ]

Based on that, we will keep improving not only for experience of UI/UX, but the new added-value features described as **IN PLAN**.

Any advices about new features or improvements would be appreciated to put forward as **Issues** to this repository.

## 3. Run dApp in developer mode

### ElastOS Essentials

Developers should have latest version of **ElastOS Essentials** application installed on mobile device of **Android** or **iOS** platform. Please check the details in the repository of [**Elastos.Essentials**](https://github.com/elastos/Elastos.Essentials)

### Run dApp

Then **clone** the repository with the commands:

```
git clone https://github.com/elastos-trinity/feeds-capsule
cd feeds-capsule
```

Input the command to install the related dependencies.

```
npm install --legacy-peer-deps
```

Input the command to launch **feeds** dApp on your **Android** device with the help of **ElastOS Essentials** application when you have **Android** connected.

```
ionic cordova run android
```

Or to launch **feeds** dApp on **iOS** device

```
ionic cordova run ios
```

## 4. Acknowledgments

A sincere thank to the all team and projects we are relying on, especially for the following projects:
- [ElastOS Essentials](https://github.com/elastos/Elastos.Essentials)
- [ionic-team](https://github.com/ionic-team/ionic-framework.git)
- [apache cordova](https://github.com/apache/cordova.git)

## 5. License

This project is licensed under the term of **GPLv3**
