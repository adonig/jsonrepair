

export class JSONRepairError {
  name: string
  message: string
  stack?: string
  position: number

  constructor(message: string, position: number) {
    this.name = "JSONRepairError"
    this.message = message + ' at position ' + position
    this.position = position
  }
}
