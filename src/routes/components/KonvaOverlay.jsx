import { Stage, Layer } from "react-konva";

export default function KonvaOverlay({
    width,
    height
}) {

    return (

        <Stage

            width={width}

            height={height}

        >

            <Layer>

            </Layer>

        </Stage>

    )

}