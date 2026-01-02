
export interface Point {
    x: number;
    y: number;
}

/**
 * Calculates the distance between two points.
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Converts Catmull-Rom spline control points to Cubic Bezier control points.
 * This allows us to use standard Canvas `bezierCurveTo` for drawing.
 * 
 * @param p0 Previous point (or p1 if at start)
 * @param p1 Start point of the segment
 * @param p2 End point of the segment
 * @param p3 Next point (or p2 if at end)
 * @param tension Tension of the curve (default 0.5)
 * @returns [cp1, cp2] - The two control points for the Cubic Bezier curve
 */
export function getCatmullRomControlPoints(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    tension: number = 0.5
): [Point, Point] {
    const cp1 = {
        x: p1.x + (p2.x - p0.x) / 6 * tension,
        y: p1.y + (p2.y - p0.y) / 6 * tension
    };

    const cp2 = {
        x: p2.x - (p3.x - p1.x) / 6 * tension,
        y: p2.y - (p3.y - p1.y) / 6 * tension
    };

    return [cp1, cp2];
}

/**
 * Calculates a point on a Cubic Bezier curve at time t (0 to 1).
 * Formula: B(t) = (1-t)^3*P1 + 3*(1-t)^2*t*CP1 + 3*(1-t)*t^2*CP2 + t^3*P2
 */
export function getPointOnCubicBezier(
    p1: Point,
    cp1: Point,
    cp2: Point,
    p2: Point,
    t: number
): Point {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
        x: mt3 * p1.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p2.x,
        y: mt3 * p1.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p2.y
    };
}

/**
 * Calculates the tangent angle (in radians) on a Cubic Bezier curve at time t.
 * This is used to rotate the train to follow the track.
 */
export function getTangentAngleOnCubicBezier(
    p1: Point,
    cp1: Point,
    cp2: Point,
    p2: Point,
    t: number
): number {
    // Derivative of Cubic Bezier:
    // B'(t) = 3(1-t)^2(CP1-P1) + 6(1-t)t(CP2-CP1) + 3t^2(P2-CP2)

    const mt = 1 - t;
    const mt2 = mt * mt;

    // dx/dt
    const dx = 3 * mt2 * (cp1.x - p1.x) +
        6 * mt * t * (cp2.x - cp1.x) +
        3 * t * t * (p2.x - cp2.x);

    // dy/dt
    const dy = 3 * mt2 * (cp1.y - p1.y) +
        6 * mt * t * (cp2.y - cp1.y) +
        3 * t * t * (p2.y - cp2.y);

    return Math.atan2(dy, dx);
}
