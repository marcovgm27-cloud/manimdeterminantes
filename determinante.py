"""
Video introductorio: el concepto de determinante de una matriz 2x2.

Escenas (en orden):
    1. Introduccion        - que es un determinante y como se escribe
    2. Transformacion      - la matriz como transformacion lineal
    3. AreaGeometrica      - el determinante como factor de escala del area
    4. DeduccionFormula    - por que det(A) = ad - bc
    5. EjemploNumerico     - calculo paso a paso
    6. DeterminanteNegativo- el signo indica la orientacion
    7. DeterminanteCero    - el espacio colapsa a una recta
    8. Resumen

Renderizar todo:
    manim -qh determinante.py
o una escena:
    manim -pql determinante.py AreaGeometrica
"""

from manim import *

# Colores consistentes en todo el video
COLOR_I = GREEN_C      # vector i (primera columna)
COLOR_J = RED_C        # vector j (segunda columna)
COLOR_AREA = YELLOW_C  # area / determinante

A_MAT = [[3, 1], [1, 2]]  # det = 3*2 - 1*1 = 5


def titulo(texto):
    t = Text(texto, font_size=40, weight=BOLD)
    t.to_edge(UP)
    return t


def matriz_tex(m, colores=True):
    mat = Matrix(m, h_buff=0.9)
    if colores:
        cols = mat.get_columns()
        cols[0].set_color(COLOR_I)
        cols[1].set_color(COLOR_J)
    return mat


class EscenaTransformacion(LinearTransformationScene):
    """LinearTransformationScene con los colores del video.

    Scene.play() reutiliza internamente el atributo ``moving_mobjects``, que
    LinearTransformationScene usa para otra cosa; sin limpiarlo, los textos
    animados antes de apply_matrix se moverian junto con el plano.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("leave_ghost_vectors", True)
        super().__init__(i_hat_color=COLOR_I, j_hat_color=COLOR_J, **kwargs)

    def apply_matrix(self, matrix, **kwargs):
        self.moving_mobjects = []
        super().apply_matrix(matrix, **kwargs)


# ---------------------------------------------------------------------------
# 1. Introduccion
# ---------------------------------------------------------------------------
class Introduccion(Scene):
    def construct(self):
        t = Text("¿Qué es un determinante?", font_size=56, weight=BOLD)
        sub = Text("Una idea geométrica antes que una fórmula",
                   font_size=30, color=GREY_B).next_to(t, DOWN)
        self.play(Write(t))
        self.play(FadeIn(sub, shift=UP * 0.3))
        self.wait(1.5)
        self.play(FadeOut(sub), t.animate.scale(0.7).to_edge(UP))

        frase = Text(
            "A cada matriz cuadrada le asociamos un número:",
            font_size=32,
        ).shift(UP * 1.6)
        self.play(FadeIn(frase))

        A = MathTex("A", "=").scale(1.2)
        mat = Matrix([["a", "b"], ["c", "d"]], h_buff=0.9)
        grupo = VGroup(A, mat).arrange(RIGHT).shift(LEFT * 2.5)
        self.play(Write(grupo))

        flecha = Arrow(LEFT, RIGHT).next_to(grupo, RIGHT)
        det = MathTex(r"\det(A)", color=COLOR_AREA).scale(1.3)
        det.next_to(flecha, RIGHT)
        self.play(GrowArrow(flecha), Write(det))
        self.wait()

        notacion = MathTex(
            r"\det(A) \;=\; |A| \;=\; \begin{vmatrix} a & b \\ c & d \end{vmatrix}"
        ).shift(DOWN * 1.8)
        nota = Text("Notaciones equivalentes", font_size=24, color=GREY_B)
        nota.next_to(notacion, DOWN)
        self.play(Write(notacion), FadeIn(nota))
        self.wait(2)

        pregunta = Text("Pero... ¿qué mide ese número?", font_size=36,
                        color=COLOR_AREA)
        self.play(
            FadeOut(VGroup(frase, grupo, flecha, det, notacion, nota)),
        )
        self.play(Write(pregunta))
        self.wait(1.5)
        self.play(FadeOut(pregunta), FadeOut(t))


# ---------------------------------------------------------------------------
# 2. La matriz como transformacion
# ---------------------------------------------------------------------------
class Transformacion(EscenaTransformacion):
    def __init__(self, **kwargs):
        super().__init__(show_coordinates=True, **kwargs)

    def construct(self):
        txt = Text("Una matriz transforma el plano", font_size=34)
        txt.to_edge(UP).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(txt)
        self.play(FadeIn(txt))

        li = MathTex(r"\hat{\imath}", color=COLOR_I).move_to([1.2, -0.4, 0])
        lj = MathTex(r"\hat{\jmath}", color=COLOR_J).move_to([-0.4, 1.2, 0])
        self.play(Write(li), Write(lj))
        self.wait()
        self.play(FadeOut(li), FadeOut(lj))

        mat = matriz_tex(A_MAT)
        etiqueta = VGroup(MathTex("A ="), mat).arrange(RIGHT)
        etiqueta.to_corner(UL).shift(DOWN * 0.8).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(etiqueta)
        self.play(FadeIn(etiqueta))

        expl = VGroup(
            Text("Las columnas indican a dónde", font_size=24),
            Text("van los vectores base", font_size=24),
        ).arrange(DOWN, aligned_edge=LEFT)
        expl.next_to(etiqueta, DOWN, aligned_edge=LEFT).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(expl)
        self.play(FadeIn(expl))
        self.wait()

        self.apply_matrix(A_MAT, run_time=3)
        self.wait()

        ni = MathTex(r"A\hat{\imath} = (3,1)", color=COLOR_I).scale(0.8)
        ni.move_to([4.6, 0.6, 0]).add_background_rectangle(opacity=0.85)
        nj = MathTex(r"A\hat{\jmath} = (1,2)", color=COLOR_J).scale(0.8)
        nj.move_to([2.6, 2.3, 0]).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobjects(ni, nj)
        self.play(Write(ni), Write(nj))
        self.wait(2.5)


# ---------------------------------------------------------------------------
# 3. El determinante como factor de escala del area
# ---------------------------------------------------------------------------
class AreaGeometrica(EscenaTransformacion):
    def construct(self):
        txt = Text("Observemos el cuadrado unitario", font_size=34)
        txt.to_edge(UP).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(txt)
        self.play(FadeIn(txt))

        cuadrado = self.add_unit_square(color=COLOR_AREA, opacity=0.4)
        area1 = MathTex(r"\text{Área} = 1").scale(0.8)
        area1.move_to([0.5, 0.5, 0]).add_background_rectangle(opacity=0.85)
        self.play(Write(area1))
        self.wait(1.5)
        self.play(FadeOut(area1))

        mat = matriz_tex(A_MAT)
        etiqueta = VGroup(MathTex("A ="), mat).arrange(RIGHT)
        etiqueta.to_corner(UL).shift(DOWN * 0.8).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(etiqueta)
        self.play(FadeIn(etiqueta))

        self.apply_matrix(A_MAT, run_time=3)
        self.wait()

        area5 = MathTex(r"\text{Área} = 5").scale(0.9)
        area5.move_to([2, 1.5, 0]).add_background_rectangle(opacity=0.85)
        self.play(Write(area5))
        self.wait()

        nuevo = Text("El área se multiplicó por 5", font_size=34)
        nuevo.to_edge(UP).add_background_rectangle(opacity=0.85)
        self.play(ReplacementTransform(txt, nuevo))
        self.add_foreground_mobject(nuevo)
        self.wait()

        caja = VGroup(
            MathTex(r"\det(A) = 5", color=COLOR_AREA).scale(1.2),
            Text("Factor por el que la matriz", font_size=24),
            Text("escala las áreas", font_size=24),
        ).arrange(DOWN)
        caja.to_corner(DR).shift(UP * 0.5)
        fondo = SurroundingRectangle(caja, color=COLOR_AREA, buff=0.25)
        fondo.set_fill(BLACK, opacity=0.85)
        grupo = VGroup(fondo, caja)
        self.add_foreground_mobject(grupo)
        self.play(FadeIn(fondo), Write(caja))
        self.wait(3)


# ---------------------------------------------------------------------------
# 4. Deduccion de la formula ad - bc
# ---------------------------------------------------------------------------
class DeduccionFormula(Scene):
    def construct(self):
        t = titulo("¿Por qué  det(A) = ad − bc ?")
        self.play(Write(t))

        u = 0.9  # unidades -> pantalla
        a, b, c, d = 3, 1, 1, 2
        origen = np.array([-5.2, -2.6, 0])

        def P(x, y):
            return origen + u * np.array([x, y, 0])

        O, Vi, Vj, S = P(0, 0), P(a, c), P(b, d), P(a + b, c + d)
        paral = Polygon(O, Vi, S, Vj, color=COLOR_AREA,
                        fill_opacity=0.45, stroke_width=3)
        vi = Arrow(O, Vi, buff=0, color=COLOR_I)
        vj = Arrow(O, Vj, buff=0, color=COLOR_J)
        li = MathTex("(a,c)", color=COLOR_I).scale(0.7).next_to(Vi, RIGHT, 0.1)
        lj = MathTex("(b,d)", color=COLOR_J).scale(0.7).next_to(Vj, LEFT, 0.1)

        self.play(GrowArrow(vi), GrowArrow(vj), Write(li), Write(lj))
        self.play(DrawBorderThenFill(paral))
        self.wait()

        rect = Rectangle(width=u * (a + b), height=u * (c + d),
                         color=WHITE, stroke_width=2)
        rect.move_to((O + S) / 2)
        self.play(Create(rect))

        # Piezas que sobran fuera del paralelogramo
        tri_ac1 = Polygon(O, P(a, 0), Vi)                 # a*c/2
        tri_ac2 = Polygon(S, P(b, c + d), Vj)             # a*c/2
        tri_bd1 = Polygon(O, Vj, P(0, d))                 # b*d/2
        tri_bd2 = Polygon(S, P(a + b, c), Vi)             # b*d/2
        rec_bc1 = Polygon(P(0, d), Vj, P(b, c + d), P(0, c + d))
        rec_bc2 = Polygon(P(a, 0), P(a + b, 0), P(a + b, c), Vi)
        estilo = dict(stroke_width=1.5, fill_opacity=0.55)
        for m, col in [(tri_ac1, BLUE_D), (tri_ac2, BLUE_D),
                       (tri_bd1, PURPLE_C), (tri_bd2, PURPLE_C),
                       (rec_bc1, TEAL_D), (rec_bc2, TEAL_D)]:
            m.set_style(fill_color=col, stroke_color=col, **estilo)

        # Lado derecho: las cuentas
        x0 = 1.3
        eq_rect = MathTex(r"\text{Rectángulo} = (a+b)(c+d)")
        eq_rect.scale(0.8).move_to([x0, 2.0, 0], aligned_edge=LEFT)
        self.play(Write(eq_rect))
        self.wait()

        eq_ac = MathTex(r"-\;2\cdot\tfrac{1}{2}ac", color=BLUE_C)
        eq_bd = MathTex(r"-\;2\cdot\tfrac{1}{2}bd", color=PURPLE_B)
        eq_bc = MathTex(r"-\;2\,bc", color=TEAL_C)
        prev = eq_rect
        for eq, piezas in [(eq_ac, (tri_ac1, tri_ac2)),
                           (eq_bd, (tri_bd1, tri_bd2)),
                           (eq_bc, (rec_bc1, rec_bc2))]:
            eq.scale(0.8).next_to(prev, DOWN, aligned_edge=LEFT, buff=0.3)
            self.play(*[FadeIn(p) for p in piezas], Write(eq))
            self.wait(0.7)
            prev = eq

        linea = Line(LEFT, RIGHT).set_width(4.5)
        linea.next_to(prev, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Create(linea))

        desarrollo = MathTex(r"= ac + ad + bc + bd - ac - bd - 2bc")
        desarrollo.scale(0.7).next_to(linea, DOWN, aligned_edge=LEFT)
        self.play(Write(desarrollo))
        self.wait()

        final = MathTex(r"\text{Área} = ad - bc", color=COLOR_AREA).scale(1.1)
        final.next_to(desarrollo, DOWN, aligned_edge=LEFT, buff=0.4)
        caja = SurroundingRectangle(final, color=COLOR_AREA, buff=0.15)
        self.play(Write(final), Create(caja))
        self.wait()

        formula = MathTex(
            r"\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc"
        ).scale(1.1).move_to([-3.4, 2.0, 0])
        self.play(
            FadeOut(VGroup(tri_ac1, tri_ac2, tri_bd1, tri_bd2,
                           rec_bc1, rec_bc2, rect)),
        )
        self.play(Write(formula))
        self.wait(3)


# ---------------------------------------------------------------------------
# 5. Ejemplo numerico
# ---------------------------------------------------------------------------
class EjemploNumerico(Scene):
    def construct(self):
        t = titulo("Calculemos uno")
        self.play(Write(t))

        det = Matrix([[3, 1], [1, 2]], left_bracket="|", right_bracket="|",
                     h_buff=0.9)
        det.scale(1.2).shift(LEFT * 3.5)
        self.play(Write(det))

        e = det.get_entries()  # orden: 3, 1, 1, 2
        diag = Line(e[0].get_center(), e[3].get_center(), color=GREEN_C,
                    stroke_width=6).set_opacity(0.6)
        anti = Line(e[1].get_center(), e[2].get_center(), color=RED_C,
                    stroke_width=6).set_opacity(0.6)

        paso1 = MathTex("=", r"3 \cdot 2", "-", r"1 \cdot 1").scale(1.3)
        paso1[1].set_color(GREEN_C)
        paso1[3].set_color(RED_C)
        paso1.next_to(det, RIGHT)

        self.play(Create(diag))
        self.play(Write(paso1[:2]))
        self.play(Create(anti))
        self.play(Write(paso1[2:]))
        self.wait()

        paso2 = MathTex("= 6 - 1").scale(1.3).next_to(paso1, RIGHT)
        self.play(Write(paso2))
        paso3 = MathTex("= 5", color=COLOR_AREA).scale(1.3)
        paso3.next_to(paso2, RIGHT)
        self.play(Write(paso3))
        self.wait()

        regla = VGroup(
            Text("Diagonal principal", font_size=28, color=GREEN_C),
            Text("menos", font_size=28),
            Text("diagonal secundaria", font_size=28, color=RED_C),
        ).arrange(RIGHT).shift(DOWN * 2)
        self.play(FadeIn(regla, shift=UP * 0.3))
        self.wait(1.5)

        conecta = Text(
            "¡Es justo el área del paralelogramo que vimos!",
            font_size=30, color=COLOR_AREA,
        ).shift(DOWN * 3)
        self.play(Write(conecta))
        self.wait(2.5)


# ---------------------------------------------------------------------------
# 6. Determinante negativo: orientacion
# ---------------------------------------------------------------------------
class DeterminanteNegativo(EscenaTransformacion):
    def construct(self):
        M = [[1, 2], [2, 1]]  # det = 1 - 4 = -3
        txt = Text("¿Y si el determinante es negativo?", font_size=34)
        txt.to_edge(UP).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(txt)
        self.play(FadeIn(txt))

        self.add_unit_square(color=COLOR_AREA, opacity=0.4)

        mat = matriz_tex(M)
        etiqueta = VGroup(MathTex("B ="), mat).arrange(RIGHT)
        etiqueta.to_corner(UL).shift(DOWN * 0.8).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(etiqueta)
        self.play(FadeIn(etiqueta))

        nota = Text("ĵ está a la izquierda de î", font_size=24)
        nota.to_corner(DR).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(nota)
        self.play(FadeIn(nota))
        self.wait()

        self.apply_matrix(M, run_time=3)
        self.wait()

        nota2 = Text("¡Ahora ĵ quedó a la derecha de î!", font_size=24)
        nota2.to_corner(DR).add_background_rectangle(opacity=0.85)
        self.play(ReplacementTransform(nota, nota2))
        self.add_foreground_mobject(nota2)

        calc = MathTex(r"\det(B) = 1\cdot1 - 2\cdot2 = -3", color=COLOR_AREA)
        calc.next_to(etiqueta, DOWN, aligned_edge=LEFT).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(calc)
        self.play(Write(calc))
        self.wait()

        expl = VGroup(
            Text("El área se multiplica por |−3| = 3", font_size=24),
            Text("y el signo − indica que el plano", font_size=24),
            Text("se dio vuelta (cambió la orientación)", font_size=24),
        ).arrange(DOWN, aligned_edge=LEFT)
        expl.next_to(calc, DOWN, aligned_edge=LEFT).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(expl)
        self.play(FadeIn(expl))
        self.wait(3)


# ---------------------------------------------------------------------------
# 7. Determinante cero
# ---------------------------------------------------------------------------
class DeterminanteCero(EscenaTransformacion):
    def construct(self):
        M = [[2, 1], [1, 0.5]]  # det = 1 - 1 = 0
        txt = Text("¿Y si el determinante es cero?", font_size=34)
        txt.to_edge(UP).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(txt)
        self.play(FadeIn(txt))

        self.add_unit_square(color=COLOR_AREA, opacity=0.4)

        mat = matriz_tex([[2, 1], [1, 0.5]])
        etiqueta = VGroup(MathTex("C ="), mat).arrange(RIGHT)
        etiqueta.to_corner(UL).shift(DOWN * 0.8).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(etiqueta)
        self.play(FadeIn(etiqueta))
        self.wait()

        self.apply_matrix(M, run_time=3)
        self.wait()

        calc = MathTex(r"\det(C) = 2\cdot0.5 - 1\cdot1 = 0", color=COLOR_AREA)
        calc.next_to(etiqueta, DOWN, aligned_edge=LEFT).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(calc)
        self.play(Write(calc))

        expl = VGroup(
            Text("Todo el plano se aplastó sobre una recta:", font_size=24),
            Text("el área se vuelve 0.", font_size=24),
            Text("Las columnas son paralelas (dependientes)", font_size=24),
            Text("y la matriz no tiene inversa.", font_size=24),
        ).arrange(DOWN, aligned_edge=LEFT)
        expl.to_corner(DR).add_background_rectangle(opacity=0.85)
        self.add_foreground_mobject(expl)
        self.play(FadeIn(expl))
        self.wait(3)


# ---------------------------------------------------------------------------
# 8. Resumen
# ---------------------------------------------------------------------------
class Resumen(Scene):
    def construct(self):
        t = titulo("En resumen")
        self.play(Write(t))

        formula = MathTex(
            r"\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc",
            color=COLOR_AREA,
        ).scale(1.1).next_to(t, DOWN, buff=0.6)
        self.play(Write(formula))

        ideas = VGroup(
            Text("• |det(A)| es el factor por el que A escala las áreas",
                 font_size=28),
            Text("• det(A) < 0: la transformación invierte la orientación",
                 font_size=28),
            Text("• det(A) = 0: el plano colapsa y A no es invertible",
                 font_size=28),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        ideas.next_to(formula, DOWN, buff=0.7)
        for idea in ideas:
            self.play(FadeIn(idea, shift=RIGHT * 0.3))
            self.wait(1.2)

        prox = Text("En 3×3, el determinante mide volúmenes.",
                    font_size=26, color=GREY_B).to_edge(DOWN)
        self.play(FadeIn(prox))
        self.wait(3)
        self.play(*[FadeOut(m) for m in self.mobjects])
