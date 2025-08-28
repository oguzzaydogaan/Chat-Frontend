const RequestEventType = {
  Message_Send: 0,
  Message_Delete: 1,
  Message_See: 2,
  Chat_Create: 3,
  Chat_AddUser: 4,
  Call_Offer: 5,
  Call_Cancel: 6,
  Call_Accept: 7,
  Call_Reject: 8,
  Call_End: 9,
  Call_Ice: 10,
}

const ResponseEventType = {
  Message_Received: 0,
  Message_Saved: 1,
  Message_Deleted: 2,
  Message_Seen: 3,
  Chat_Created: 4,
  Chat_UserAdded: 5,
  Call_Offered: 6,
  Call_Cancelled: 7,
  Call_Accepted: 8,
  Call_Rejected: 9,
  Call_Ended: 10,
  Call_Ice: 11,
  Error: 12,
}

export { RequestEventType, ResponseEventType }
export default { RequestEventType, ResponseEventType }
