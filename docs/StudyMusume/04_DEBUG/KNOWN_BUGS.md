# Known Bugs

## 2026-05-10 時点

- `npm run lint` が `.viewer-temp` や `.gradle-user` まで走査して重くなりやすい
- `src/pages/Home.jsx` に React Compiler 系の lint 指摘が残っている
- `src/contexts/SoundContext.jsx` に ref 参照まわりの lint 指摘がある
