package mail

import (
	"fmt"
)

const gmailBaseAddr = "smtp.gmail.com"
const gmailAddrPort = 587
const stageEmailAddress = "ischooldancecap@gmail.com"

var gmailAddr = fmt.Sprintf("%s:%v", gmailBaseAddr, gmailAddrPort)
