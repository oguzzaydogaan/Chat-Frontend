const RequestEventType = {
  Message_Send: 0,
  Message_Delete: 1,
  Message_See: 2,
  Chat_Create: 3,
  Chat_AddUser: 4,
}

const ResponseEventType = {
  Message_Received: 0,
  Message_Saved: 1,
  Message_Deleted: 2,
  Message_Seen: 3,
  Chat_Created: 4,
  Chat_UserAdded: 5,
  Error: 6,
}

export { RequestEventType, ResponseEventType }
export default { RequestEventType, ResponseEventType }
