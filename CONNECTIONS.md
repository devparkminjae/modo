# CONNECTIONS — 외부 서비스 참고

이 문서는 사용할 수 있는 외부 서비스와 역할을 정리한다. 서비스가 적혀 있다는 이유만으로 계정 생성, 연동, 결제가 완료된 것으로 간주하지 않는다. 실제 연결 전 공식 문서, 현재 요금제, 데이터 처리 조건을 확인한다.

## 우선 후보

| 서비스 | 사용 목적 | 초기 선택 기준 |
| --- | --- | --- |
| **Supabase** | 인증, PostgreSQL, 실시간 이벤트, 이미지 저장 | MVP 기본 백엔드 후보. Row Level Security 정책, 백업/복구, 지역, 요금 제한을 검토한다. |
| **Render** | Expo 웹 정적 배포, 필요 시 API/작업자 | Expo 웹 빌드 결과를 Static Site로 배포하는 안을 우선 검토한다. 별도 서버가 필요하면 Web Service를 추가한다. |
| **Expo / EAS** | 웹·iOS·Android 앱 개발과 네이티브 빌드 | 앱 프레임워크 후보가 아니라 기본 앱 개발 도구로 사용한다. Expo Router로 웹과 네이티브 화면/경로를 공유한다. |

## 연결 우선순위

1. Supabase 프로젝트를 개발/운영 환경으로 분리하고 인증·DB 접근 정책을 설계한다.
2. Expo 앱의 웹 빌드를 Render Static Site에 배포하고 미리보기 및 운영 환경을 분리한다.
3. iOS·Android 테스트 및 배포를 위해 EAS Build/Submit을 연결한다.
4. 별도 서버 프로세스나 비동기 작업 요구가 확인되면 Render Web Service를 추가한다.

## 비밀 값 관리

- 저장소에는 `.env.example`의 변수 이름과 설명만 둔다.
- 앱에는 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 설정한다. Supabase의 publishable key는 클라이언트 공개용이며, 데이터 접근은 RLS로 제한한다.
- 비밀 키, DB 비밀번호, 서비스 역할 키, 토큰은 브라우저 번들·문서·로그·커밋에 넣지 않는다.
- 키가 노출되면 즉시 폐기하고 교체한다.
- 각 호스트의 미리보기 환경과 운영 환경에 서로 다른 키를 설정한다.

## 결정 기록

- Supabase 개발 프로젝트: `modo` 조직의 `modo alpha v0.0.1` (프로젝트 ref: `gpfzdokcokzgllqiobak`, Seoul 화면 선택 후 생성 결과는 Mumbai 리전으로 표시됨, Free/nano).
- Supabase 프로젝트는 GitHub `devparkminjae/modo`와 연결되어 있다. 앱의 URL과 publishable key는 무시 규칙이 적용된 `apps/app/.env`에 설정한다.
- 초기 DB 마이그레이션은 `supabase/migrations/202610220001_initial_schema.sql`이며, 해당 프로젝트에 적용했다.
- Supabase는 인증·DB·실시간 기능, Expo/EAS는 크로스 플랫폼 앱 개발·빌드, Render는 웹/API 배포에 사용한다. 운영 플랜과 설정은 출시 전 확정한다.
- 서비스별 최신 제한과 가격은 변할 수 있으므로 연결 시점의 공식 페이지에서 확인한다.
