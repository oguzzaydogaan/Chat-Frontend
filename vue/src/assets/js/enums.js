const RequestEventType = {
  Message_Send: 0,
  Message_Delete: 1,
  Message_See: 2,
  Chat_Create: 3,
  Chat_AddUser: 4,
  Call_Offer: 5,
  Call_Accept: 6,
  Call_Reject: 7,
  Call_Ice: 8,
}

const ResponseEventType = {
  Message_Received: 0,
  Message_Saved: 1,
  Message_Deleted: 2,
  Message_Seen: 3,
  Chat_Created: 4,
  Chat_UserAdded: 5,
  Call_Offered: 6,
  Call_Accepted: 7,
  Call_Rejected: 8,
  Call_Ice: 9,
  Error: 10,
}

export { RequestEventType, ResponseEventType }
export default { RequestEventType, ResponseEventType }
