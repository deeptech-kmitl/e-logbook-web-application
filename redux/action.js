export const SET_USER = 'SET_USER';
export const SET_ROLE = 'SET_ROLE';
export const CLEAR_USER = 'CLEAR_USER';
export const SET_SUBJECT = 'SET_SUBJECT';

export const setUser = (user) => ({
  type: SET_USER,
  payload: user,
});

export const setRole = (role) => ({
  type: SET_ROLE,
  payload: role,
});

export const clearUser = () => ({
  type: CLEAR_USER,
});

export const setSubject = (subject) => ({
  type: SET_SUBJECT,
  payload: subject,
});