const SET_GAME = "SET_GAME";
const SET_NAME = "SET_NAME";


export function reducer(state, action) {
  switch (action.type) {
    case SET_GAME:
      return {
        name: state.name,
        game: action.game,
      };
    case SET_NAME:
      return {
        name: action.name,
        gender: state.game,
      };
    default:
      return initialState;
  }
}