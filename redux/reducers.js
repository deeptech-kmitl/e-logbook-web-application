import { SET_USER, SET_ROLE, CLEAR_USER, SET_SUBJECT, CLEAR_SUBJECT } from './action';

const initialState = {
  user: null,
  role: null,
  subject: null
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case SET_ROLE:
      return { ...state, role: action.payload };
    case CLEAR_USER:
      return { ...state, user: null, role: null };
    case SET_SUBJECT:
        return { ...state, subject: action.payload };
    case CLEAR_SUBJECT:
        return { ...state, subject: null };
    default:
      return state;
  }
};

export default userReducer;