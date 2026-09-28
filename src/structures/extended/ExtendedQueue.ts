import { RainlinkQueue, RainlinkTrack } from 'rainlink'

export class ExtendedQueue extends RainlinkQueue {
  public previousState: RainlinkTrack[] = []

  public restore() {
    this.length = 0
    this.push(...this.previousState)
    return this
  }

  public splice(start: number, deleteCount?: number, ...items: RainlinkTrack[]): ExtendedQueue {
    super.splice(start, deleteCount, ...items)
    this.previousState.splice(start, deleteCount, ...items)
    return this
  }

  public push(...items: RainlinkTrack[]): number {
    super.push(...items)
    this.previousState.push(...items)
    return items.length
  }

  public unshift(...items: RainlinkTrack[]): number {
    super.unshift(...items)
    this.previousState.unshift(...items)
    super.shift()
    return items.length
  }

  public shift(): RainlinkTrack {
    this.previousState.shift()
    return super.shift()
  }
}
