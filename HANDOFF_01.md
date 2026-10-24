# Modo — 인수인계 메모 01

다음 채팅에서 이 문서를 먼저 읽고 현재 작업을 이어간다. 사용자에게 이미 정해진 내용을 다시 묻거나, 확인 없이 외부 설정을 바꾸지 않는다.

## 사용자와 협업 방식

- 사용자와 대화는 정중한 한국어로 한다. 반말 금지.
- 사용자는 잘못된 단정, 할루시네이션, 이미 답한 내용 재질문, 도중에 멈추는 것에 매우 불만이 큼. 실제 상태를 확인하고 사실만 보고한다.
- 사용자는 비판적으로 검토하라고 했지만, 결정이 명확해지면 승인된 일을 계속 진행한다.
- 개인정보·비밀번호·API 키를 문서나 채팅 답변에 복사하지 않는다. Supabase 폼의 비밀번호는 화면 자동화에서 가려질 수 있으므로 DOM에서 값이 안 보인다고 입력하지 않았다고 단정하지 않는다.

## 제품 방향과 요구사항

- 제품 이름: 모도(Modo). 초기 카카오톡의 기본 메신저 경험을 참고하되 자체 브랜드를 사용한다. 카카오톡 자산/로고/캐릭터/화면 복제 금지.
- 크로스플랫폼: Expo + React Native + Expo Router + TypeScript, 웹과 추후 iOS·Android에서 같은 모바일 중심 UI를 사용한다.
- 사용자는 공개 가입. 이메일 또는 전화번호로 로그인 가능, 전화번호 인증 필수, 사용자 아이디 중복 금지.
- 친구 탭 상단에 내 프로필, 아래 친구 목록. 주요 탭은 친구/채팅/설정.
- 친구 추가 경로: 주소록에서 선택, 아이디 검색, QR, 전화번호 검색. 주소록 전체 데이터는 기기에만 두고 서버에 업로드하지 않는다. 사용자가 선택한 한 명만 매칭에 쓴다.
- 전화번호 검색 노출 여부는 설정으로 사용자가 제어.
- 개인채팅은 첫 메시지 전송 후 목록에 나타난다. 일반 단체채팅은 같은 권한. 팀채팅 방장/부방장은 MVP 이후로 미룸.
- 웹에서는 좌측 브랜드, 우측에 고정된 휴대폰 비율 앱 화면. 좁은 화면은 앱이 전체 화면. 사용자가 지금 요청한 작업: 화면 상단에 적당한 여백 추가, 계정 기능 추가.

## 기술 및 현재 저장소

- 작업 디렉터리: `/Users/SNUE/Desktop/modo`
- Expo SDK 58 / React Native 0.88 / Expo Router 58 / TypeScript strict / pnpm workspace.
- 화면 파일은 `apps/app/src/app/`, 공통 UI는 `apps/app/src/components/MessengerUI.tsx`, Supabase client는 `apps/app/src/lib/supabase.ts`.
- 루트 문서: `MAIN.md`, `STRUCTURE.md`, `UI.md`, `CONNECTIONS.md`, `TODO.md`, `README.md`.
- 기존 UI는 `friends`, `chats`, `settings` 탭이며 현재 친구 화면/설정에 샘플 프로필 데이터가 남아 있다. 로그인/가입 흐름은 아직 구현되지 않았다.
- 앱 `web.output`은 `single`; 사용자가 Render 서비스 유형을 **Web Service**로 명시 결정했다. Static Site로 바꾸거나 다시 설득하지 않는다.

## Supabase — 완료된 외부 설정

- Supabase 조직: `modo`; 프로젝트명: `modo alpha v0.0.1`; ref: `gpfzdokcokzgllqiobak`; URL `https://gpfzdokcokzgllqiobak.supabase.co`.
- 프로젝트 상태를 Healthy로 확인했고, GitHub `devparkminjae/modo`에 연결되어 있다. `nexa` 프로젝트는 사용하지 않았다.
- 생성 폼에서 Seoul 선택을 시도했으나 실제 프로젝트 개요는 **Mumbai (ap-south-1)**를 표시했다. 이는 이전 진행에서 잘못된 설정으로 만들어진 사실이다. 현재 프로젝트를 삭제/재생성하지 말고, 리전 변경을 진행하지 않는다. 사용자가 수정 요청하면 리전 변경의 실제 영향과 비용/프로젝트 제한을 먼저 확인한다.
- 초기 SQL `supabase/migrations/202610220001_initial_schema.sql`은 SQL Editor에서 성공 실행. `profiles`, `friendships`, `conversations`, `conversation_members`, `messages` 테이블이 Table Editor에 나타나는 것까지 확인했다. RLS, 접근 정책, 개인 대화 생성 함수 포함.
- `apps/app/.env`에 프로젝트 URL과 publishable key를 설정했다. Git ignore 대상이다. 실제 키 값을 handoff, 커밋, 로그에 복사하지 않는다. DB 비밀번호나 service-role key는 앱에 넣지 않는다.
- Supabase SMS provider는 아직 설정하지 않았다. 전화번호 OTP는 Twilio/Vonage 등 provider 및 자격 증명 설정이 필요할 수 있으므로 실제 SMS 동작을 보장한다고 말하지 않는다.

## Render — 다음 즉시 작업

- 사용자가 Render를 열어 두었고, 프로젝트 `modo`, environment `dev`, GitHub repo `devparkminjae/modo`를 선택한 미완성 **New Web Service** 폼이 있다.
- 사용자의 최종 지시: **“web service로 한다”**. 이 결정이 현재 유효하다. Static Site로 바꾸지 않는다.
- 폼 초기값은 Ruby, build `bundle install`, branch `main`, region Ohio(기존 서비스 3개), free instance였음. 이는 폼 기본값일 뿐 최종 설정 아님. Expo/TypeScript 앱에 맞는 Node runtime, monorepo root/build/start 설정을 검토해 폼을 완성해야 한다.
- 앱은 클라이언트에서 실행되는 Expo 웹앱이며 Supabase가 데이터/Auth를 담당한다. Web Service를 선택했으므로 Render에서 실제로 실행할 적절한 Node start process와 빌드 명령을 정해 배포 가능한 설정을 만든다. 근거 없는 설정 입력 금지. 필요하면 repo의 package scripts와 Render 공식 문서를 확인한다.
- Render 환경 변수에는 Supabase URL과 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요하다. 키를 Render에 전송/입력하기 전에는 action-time 확인이 필요하다. service-role key 금지.
- 유료 compute 선택이나 구독 업그레이드 금지. 현재 폼은 Free `$0/month` 선택이었다.
- 서비스 생성은 사용자가 요청했으므로 무료로 올바른 설정을 준비하고 생성 진행 가능. 최종 submit 전에 타입/요금/공개 URL/환경 변수를 재확인하고 민감정보 확인 정책을 따른다.

## 이번 사용자 요청 중 아직 미완료

1. 계정 기능: 이메일 가입/로그인, 전화번호 OTP 로그인, 전화번호 필수 인증, 프로필 생성, 세션 복구, 로그아웃. 현재 auth UI와 함수는 없음.
2. 휴대폰 화면 콘텐츠 위쪽 여백을 추가. 데스크톱 프레임의 크기/비율 유지. 관련 root layout: `apps/app/src/app/_layout.tsx`.
3. Render Web Service 폼을 Node/Expo 구성으로 완성하고 사용자 의도에 맞게 생성.
4. 설정 탭의 샘플 계정 프로필/전화번호 검색 토글이 실제 Supabase 프로필과 연동되도록 할 것(계정 기능 범위 내에서).

## 개발 지침 / 주의

- `apps/app/AGENTS.md`는 Expo API 변경 전 해당 SDK 버전 공식 문서 확인과 완료 전 lint/typecheck를 지시한다. Expo SDK는 58.
- UI 변경은 기존 단정하고 밝은 모도 스타일에 맞춘다. 이번 세션에서 Impeccable skill context를 이미 읽었으며, PRODUCT.md가 현재 `Platform: web`이라고 선언했지만 코드에는 Expo/React Native가 있다. 자동 컨텍스트 진단은 이를 `adaptive`로 고치라고 권고했으나, 이번 작업과 무관해 변경하지 않았다.
- TODO는 Supabase 프로젝트 및 초기 migration 완료로 체크되어 있다. Git 작업트리에는 이미 많은 staged/unstaged 파일이 있다. 기존 사용자 변경을 reset/revert하지 않는다.
- 로컬 웹 서버를 새 Supabase env로 실행한 마지막 세션은 `pnpm web`, `http://localhost:8081`. 현재 세션 종료/재시작 후에도 실행 중이라고 가정하지 말고 상태를 확인한다.
- 직전 작업에서는 계정 구현 및 상단 여백을 실제로 편집하지 못했다. 완료한 것처럼 말하지 않는다.
