## Installation

##### Thêm Vào package.json
```
"my-rn-firebase": "git+https://gitlab.com/react-native-my-libs/my-rn-firebase.git",
```

Chạy  lệnh sau
```
yarn install
```

## Sử dụng

**Khởi tạo trước khi làm bất cứ hoạt động nào**
```javascript
FirebaseUtils.initFirebase(Keys.FIRE_BASE_CONFIG);
```

**Save dữ liệu**
```javascript
saveObject(key: string | number, value)
```

**Đồng bộ tất cả các data đã save lên server**
```javascript
await FirebaseUtils.excuteAllWaitCommand();
```
