const RequestEventType = {
  Message_Send: 0,
  Message_Delete: 1,
  Message_See: 2,
  Chat_Create: 3,
  Chat_AddUser: 4,
}

const ResponseEventType = {
  Message_Sent: 0,
  Message_Deleted: 1,
  Message_Seen: 2,
  Chat_Created: 3,
  Chat_UserAdded: 4,
  Error: 5,
}

export { RequestEventType, ResponseEventType }
export default { RequestEventType, ResponseEventType }
