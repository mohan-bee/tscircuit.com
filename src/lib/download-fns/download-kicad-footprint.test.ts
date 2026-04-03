import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import JSZip from "jszip"

type FootprintEntry = {
  footprintName: string
  kicadModString: string
}

const saveAsMock = mock(() => {})
let mockedFootprints: FootprintEntry[] = []

mock.module("file-saver", () => ({
  saveAs: saveAsMock,
}))

mock.module("circuit-json-to-kicad", () => ({
  CircuitJsonToKicadLibraryConverter: class {
    constructor(_circuitJson: unknown[], _options?: unknown) {}
    runUntilFinished() {}
    getFootprints() {
      return mockedFootprints
    }
  },
}))

const { downloadKicadFootprint } = await import("./download-kicad-footprint")

describe("downloadKicadFootprint", () => {
  beforeEach(() => {
    mockedFootprints = []
    saveAsMock.mockClear()
  })

  afterEach(() => {
    mockedFootprints = []
  })

  it("downloads a single .kicad_mod file when one footprint is generated", async () => {
    mockedFootprints = [
      {
        footprintName: "Demo_TestPad",
        kicadModString: `(footprint "Demo_TestPad")`,
      },
    ]

    await downloadKicadFootprint([], "ignored-name")

    expect(saveAsMock).toHaveBeenCalledTimes(1)

    const firstCall = saveAsMock.mock.calls[0]
    expect(firstCall).toBeDefined()
    const [blob, fileName] = firstCall as unknown as [Blob, string]
    expect(fileName).toBe("Demo_TestPad.kicad_mod")
    expect(await blob.text()).toBe(`(footprint "Demo_TestPad")`)
  })

  it("downloads a zip of .kicad_mod files when multiple footprints are generated", async () => {
    mockedFootprints = [
      {
        footprintName: "Footprint One",
        kicadModString: `(footprint "Footprint One")`,
      },
      {
        footprintName: "Footprint/Two",
        kicadModString: `(footprint "Footprint Two")`,
      },
    ]

    await downloadKicadFootprint([], "My Library")

    expect(saveAsMock).toHaveBeenCalledTimes(1)

    const firstCall = saveAsMock.mock.calls[0]
    expect(firstCall).toBeDefined()
    const [blob, fileName] = firstCall as unknown as [Blob, string]
    expect(fileName).toBe("My-Library_kicad_footprints.zip")

    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(Object.keys(zip.files).sort()).toEqual([
      "Footprint-One.kicad_mod",
      "Footprint-Two.kicad_mod",
    ])
    expect(await zip.file("Footprint-One.kicad_mod")?.async("text")).toBe(
      `(footprint "Footprint One")`,
    )
    expect(await zip.file("Footprint-Two.kicad_mod")?.async("text")).toBe(
      `(footprint "Footprint Two")`,
    )
  })
})
