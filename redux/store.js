import { legacy_createStore as createStore } from 'redux';
import userReducer from './reducers';

const store = createStore(userReducer);

export default store;