import { AnyCircuitElement } from "circuit-json"
import { CircuitJsonToKicadLibraryConverter } from "circuit-json-to-kicad"
import { saveAs } from "file-saver"
import JSZip from "jszip"
import { normalizeName } from "@/lib/utils/normalizeName"

const getSafeBaseName = (value: string) => {
  const normalized = normalizeName(value)
  return normalized || "kicad_footprint"
}

export const downloadKicadFootprint = async (
  circuitJson: AnyCircuitElement[],
  fileName: string,
) => {
  const converter = new CircuitJsonToKicadLibraryConverter(circuitJson, {
    libraryName: getSafeBaseName(fileName),
    footprintLibraryName: getSafeBaseName(fileName),
  })
  converter.runUntilFinished()

  const footprints = converter.getFootprints()

  if (footprints.length === 0) {
    throw new Error("No KiCad footprints could be generated from this circuit")
  }

  if (footprints.length === 1) {
    const [footprint] = footprints
    const blob = new Blob([footprint.kicadModString], { type: "text/plain" })
    saveAs(blob, `${getSafeBaseName(footprint.footprintName)}.kicad_mod`)
    return
  }

  const zip = new JSZip()
  for (const footprint of footprints) {
    zip.file(
      `${getSafeBaseName(footprint.footprintName)}.kicad_mod`,
      footprint.kicadModString,
    )
  }
  const content = await zip.generateAsync({ type: "blob" })
  saveAs(content, `${getSafeBaseName(fileName)}_kicad_footprints.zip`)
}
