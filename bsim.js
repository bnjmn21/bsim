function bsim(world) {
    // Get plugins
    const {Loop} = world.plugin(Plugins.default);
    const {Canvas, CanvasObjectComponent} = world.plugin(canvasRendererPlugin);
    const {TransformComponent, CameraTransformComponent, Camera2d} = world.plugin(render2dPlugin);
    const {DOM2dObjectComponent} = world.plugin(DOM2dPlugin);

    // Create resources
    const CanvasRes = world.resource(new Canvas(document.getElementById('main-canvas')));
    const DOM2dRes = world.resource(document.getElementById('dom2d-canvas'));
    const Camera2dRes = world.resource(new Camera2d(new Vec2(0, 0), new Vec2(1, 1)));

    // Create square
    function square(ctx) {
        ctx.lineWidth = 10;
        ctx.strokeStyle = "white";
        ctx.lineCap = "square";
        ctx.lineJoin = "square";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50, 0);
        ctx.lineTo(50, 50);
        ctx.lineTo(0, 50);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }

    // Initialize squares at 4 different positions
    world.spawn(
        TransformComponent.new(new Vec2(100, 100)),
        CameraTransformComponent.new(Camera2dRes),
        CanvasObjectComponent.new(square),
    );

    world.spawn(
        TransformComponent.new(new Vec2(200, 100)),
        CameraTransformComponent.new(Camera2dRes),
        CanvasObjectComponent.new(square),
    );
    world.spawn(
        TransformComponent.new(new Vec2(200, 200)),
        CameraTransformComponent.new(Camera2dRes),
        CanvasObjectComponent.new(square),
    );
    world.spawn(
        TransformComponent.new(new Vec2(100, 200)),
        CameraTransformComponent.new(Camera2dRes),
        CanvasObjectComponent.new(square),
    );

    // Initialize text
    world.spawn(
        TransformComponent.new(),
        CameraTransformComponent.new(Camera2dRes),
        DOM2dObjectComponent.new(world.getResource(DOM2dRes))
    );

    // Initialize canvas
    world.system(world.Setup, (_, r) => {
        r(CanvasRes).autoFitToParent();
        r(Camera2dRes).enableCanvasMouseControls(r(CanvasRes).canvas, 1, true);
    });

    // Render squares
    world.system(Loop, TransformComponent, CanvasObjectComponent, (entities, r) => {
        r(CanvasRes).clear();
        for (const e of entities) {
            e(CanvasObjectComponent).render(r(CanvasRes).getContext2d(), e(TransformComponent));
        }
    });

    // Render Text
    world.system(Loop, TransformComponent, DOM2dObjectComponent, (entities, r) => {
        for (const e of entities) {
            const htmlElement = e(DOM2dObjectComponent).htmlElement;
            if (htmlElement.childElementCount == 0) {
                htmlElement.appendChild((() => {
                    const subElem = document.createElement("p");
                    subElem.classList.add("test");
                    subElem.innerHTML = "Das hier ist etwas Text sdjfidsjfisd\njsaidai";
                    subElem.style.transform
                    return subElem;
                })());
            }
            let transform = "";
            for (const t of e(TransformComponent).transformations) {
                if (t.type == "translate") transform += `translate(${t.data.x}px, ${t.data.y}px)`;
                if (t.type == "rotate") transform += `rotate(${t.data}deg)`;
                if (t.type == "scale") transform += `scale(${t.data.x}, ${t.data.y})`;
            }
            htmlElement.style.transform = transform;
        }
    });

    console.log(world);
}