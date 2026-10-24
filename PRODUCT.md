# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Expo + React Native + Expo Router + TypeScript for one web/iOS/Android app codebase; Supabase for authentication, PostgreSQL, and realtime messaging; Render for web deployment. This was selected to keep the web chat surface close to the future mobile app and to support device contacts natively.

## Users

Anyone who wants to sign up and message people they know. Signup is open to the public; friends and small groups are the main conversation context.

## Product Purpose

Modo is a lightweight messenger centered on the familiar messaging and friend features of early KakaoTalk. Success means users can create an account, add friends, and reliably exchange one-to-one and ordinary group messages without unrelated social or commerce features getting in the way.

## Positioning

Keep the product focused on a classic friend-based messenger: profile and friends, private one-to-one conversations, and ordinary group chats. The product does not expand into a general-purpose social or commerce platform.

## Operating Context

Users can access the same mobile-oriented app flow on the web and, later, iOS and Android. On desktop web, a brand area sits beside a phone-sized app surface; on narrow screens the app surface fills the viewport. Users may add friends by selecting an on-device contact, searching by unique ID or phone number, or scanning a QR code.

## Capabilities and Constraints

- Open signup; login by email or phone number; phone verification is required.
- User IDs must be unique.
- Phone-number discoverability is controlled by a setting.
- The address book stays on the user's device. Never upload or store the full address book. Only a person the user selects to add is used for matching and friend-relationship creation.
- The MVP includes friends, one-to-one chats, ordinary group chats with equal member permissions, text messages, read state, and the Friends/Chats/Settings tabs.
- A one-to-one conversation appears in the chat list after the first message is sent.
- Team chats with owners/deputies are deferred until after the MVP.
- Photo sharing, stickers, push notifications, and other expanded messenger features are not part of the first implementation unless reprioritized.
- The implementation must not use KakaoTalk's name, logo, characters, or copied screen assets.

## Product Principles

- Keep messaging and friend management as the primary jobs.
- Require explicit user action before using a device contact to add a friend.
- Store only the friend relationship from contact-based friend adding, not the address book.
- Use the same mobile-oriented navigation across web and native apps.
- Keep access to conversations limited to their participants.

## Open Decisions

- Whether selected-contact matching sends a phone number for a one-time lookup, or uses another matching method that avoids sending that identifier.
- Message retention and account-deletion behavior.
- Whether photo sharing or push notifications should move into the MVP.
