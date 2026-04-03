import { AnyCircuitElement } from "circuit-json"
import { saveAs } from "file-saver"

export const downloadStepFile = async (
  circuitJson: AnyCircuitElement[],
  fileName: string,
) => {
  const { circuitJsonToStep } = await import("circuit-json-to-step")
  const content = await circuitJsonToStep(circuitJson)
  const blob = new Blob([content], { type: "text/plain" })
  saveAs(blob, fileName + ".step")
}
