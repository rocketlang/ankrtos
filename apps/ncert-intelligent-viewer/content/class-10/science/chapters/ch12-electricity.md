# Chapter 12: Electricity

**Class 10 Science**
**NCERT Textbook**

---

## 12.1 Electric Current and Circuit

Have you ever wondered what makes a bulb glow when you flip a switch? Or how does electricity flow through wires to power our homes? In this chapter, we will explore the fascinating world of electricity!

### What is Electric Current?

An **electric current** is a flow of electric charge. In electric circuits, this charge is often carried by electrons moving through a wire. It can also be carried by ions in an electrolyte.

**Definition:** Electric current is defined as the rate of flow of electric charge through a conductor.

Mathematically:
```
I = Q / t
```

Where:
- I = Electric current (measured in Amperes, A)
- Q = Electric charge (measured in Coulombs, C)
- t = Time (measured in seconds, s)

### Electric Circuit

An electric circuit is a closed path through which electric current can flow. A simple circuit consists of:

1. **Power source** (Battery or cell)
2. **Conducting wires** (Usually copper)
3. **Load** (Bulb, resistor, motor, etc.)
4. **Switch** (To control the flow)

![Simple Electric Circuit](diagrams/circuit-basic.png)

**Key Point:** A circuit must be complete (closed) for current to flow. If there's a break anywhere, current cannot flow!

---

## 12.2 Electric Potential and Potential Difference

### Electric Potential

Just like water flows from higher to lower level due to gravitational potential difference, electric charges flow due to electric potential difference.

**Electric potential** at a point is the work done in bringing a unit positive charge from infinity to that point.

### Potential Difference (Voltage)

The **potential difference** between two points in a circuit is the work done to move a unit charge from one point to another.

```
V = W / Q
```

Where:
- V = Potential difference (Voltage, measured in Volts, V)
- W = Work done (measured in Joules, J)
- Q = Charge (measured in Coulombs, C)

**SI Unit:** The SI unit of potential difference is **Volt (V)**.

**Definition of 1 Volt:** If 1 joule of work is done in moving 1 coulomb of charge from one point to another, the potential difference between the two points is 1 volt.

---

## 12.3 Ohm's Law

One of the most fundamental laws in electricity is **Ohm's Law**, discovered by German physicist Georg Simon Ohm in 1827.

### Statement of Ohm's Law

**Ohm's Law states that:** The electric current flowing through a conductor is directly proportional to the potential difference across its ends, provided the physical conditions (like temperature) remain constant.

Mathematically:
```
V ∝ I

or

V = I × R
```

Where:
- V = Potential difference (Volts, V)
- I = Electric current (Amperes, A)
- R = Resistance (Ohms, Ω)

### Understanding Through an Example

Imagine a water pipe:
- **Voltage (V)** is like water pressure
- **Current (I)** is like the flow rate of water
- **Resistance (R)** is like the pipe's narrowness

Higher pressure → More water flow
Similarly, Higher voltage → More current

But if the pipe is narrower (higher resistance) → Less water flow
Similarly, Higher resistance → Less current (for same voltage)

### Experimental Verification

You can verify Ohm's law using a simple experiment:

**Setup:**
1. Connect a resistor in series with an ammeter
2. Connect a battery and a voltmeter across the resistor
3. Vary the voltage and measure current

**Observation:** Plot a graph of V vs I. You'll get a straight line passing through the origin, confirming V ∝ I.

![Ohm's Law Graph](diagrams/ohms-law-graph.png)

**Slope of this graph = Resistance (R)**

---

## 12.4 Resistance and Resistivity

### What is Resistance?

**Resistance** is the property of a conductor that opposes the flow of electric current through it.

**SI Unit:** Ohm (Ω)

**Definition of 1 Ohm:** If a potential difference of 1 volt causes a current of 1 ampere to flow through a conductor, its resistance is 1 ohm.

### Factors Affecting Resistance

The resistance of a conductor depends on:

1. **Length (L):** R ∝ L
   Longer the wire, greater the resistance

2. **Cross-sectional Area (A):** R ∝ 1/A
   Thicker the wire, lesser the resistance

3. **Material (ρ):** Different materials have different resistivities
   Copper has low resistance, rubber has very high resistance

4. **Temperature:** For most conductors, resistance increases with temperature

### Formula for Resistance

```
R = ρ × (L / A)
```

Where:
- R = Resistance (Ω)
- ρ = Resistivity of material (Ω⋅m)
- L = Length of conductor (m)
- A = Cross-sectional area (m²)

### Resistivity

**Resistivity (ρ)** is a characteristic property of a material. It is the resistance of a conductor of unit length and unit cross-sectional area.

**SI Unit:** Ohm-meter (Ω⋅m)

**Good Conductors:** Low resistivity (e.g., Silver, Copper, Aluminum)
**Insulators:** Very high resistivity (e.g., Rubber, Glass, Wood)

---

## 12.5 Combination of Resistors

In circuits, resistors can be connected in two ways:

### 12.5.1 Series Connection

When resistors are connected end-to-end, they are in **series**.

**Properties:**
1. Same current flows through each resistor
2. Total voltage = Sum of individual voltages
3. **Equivalent resistance:** R_total = R₁ + R₂ + R₃ + ...

**Formula:**
```
V = V₁ + V₂ + V₃

R_s = R₁ + R₂ + R₃
```

**Key Point:** In series, total resistance is GREATER than any individual resistance.

![Series Circuit](diagrams/resistors-series.png)

### 12.5.2 Parallel Connection

When one end of all resistors is connected to one point and the other end to another point, they are in **parallel**.

**Properties:**
1. Same voltage across each resistor
2. Total current = Sum of individual currents
3. **Equivalent resistance:** 1/R_total = 1/R₁ + 1/R₂ + 1/R₃ + ...

**Formula:**
```
I = I₁ + I₂ + I₃

1/R_p = 1/R₁ + 1/R₂ + 1/R₃
```

**Key Point:** In parallel, total resistance is LESS than the smallest individual resistance.

![Parallel Circuit](diagrams/resistors-parallel.png)

---

## 12.6 Heating Effect of Electric Current

When electric current flows through a resistor, electrical energy is converted into heat energy. This is called the **heating effect of current**.

### Joule's Law of Heating

The heat produced in a conductor is:
1. Directly proportional to the square of current (I²)
2. Directly proportional to resistance (R)
3. Directly proportional to time (t)

**Formula:**
```
H = I² × R × t

or

H = V² × t / R

or

H = V × I × t
```

Where:
- H = Heat produced (Joules, J)
- I = Current (Amperes, A)
- R = Resistance (Ohms, Ω)
- t = Time (seconds, s)
- V = Voltage (Volts, V)

### Applications

**Useful Applications:**
1. Electric iron
2. Electric heater
3. Electric kettle
4. Electric toaster
5. Electric fuse (safety device)

**How Electric Fuse Works:**
- Made of material with low melting point (tin-lead alloy)
- When excessive current flows, fuse wire heats up and melts
- Circuit breaks, preventing damage to appliances

---

## 12.7 Electric Power

**Electric power** is the rate at which electrical energy is consumed or converted into other forms of energy.

**Formula:**
```
P = V × I

or

P = I² × R

or

P = V² / R
```

Where:
- P = Power (Watts, W)
- V = Voltage (Volts, V)
- I = Current (Amperes, A)
- R = Resistance (Ohms, Ω)

**SI Unit:** Watt (W)

**Definition of 1 Watt:** If 1 ampere of current flows through a conductor across which the potential difference is 1 volt, the power is 1 watt.

### Commercial Unit of Energy

In daily life, we use a larger unit called **kilowatt-hour (kWh)** or "unit".

```
1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ J
```

**Example:** If a 100W bulb runs for 10 hours:
```
Energy = 100W × 10h = 1000 Wh = 1 kWh = 1 unit
```

---

## Summary

**Key Concepts:**

1. **Electric Current (I)** = Q / t, measured in Amperes (A)

2. **Potential Difference (V)** = W / Q, measured in Volts (V)

3. **Ohm's Law:** V = I × R

4. **Resistance (R)** = ρ × L / A, measured in Ohms (Ω)

5. **Series:** R_s = R₁ + R₂ + R₃

6. **Parallel:** 1/R_p = 1/R₁ + 1/R₂ + 1/R₃

7. **Joule's Heating:** H = I² × R × t

8. **Electric Power:** P = V × I, measured in Watts (W)

9. **Energy:** E = P × t, commercial unit is kWh

---

## Exercises

**Question 1:** What does an electric circuit mean?

**Question 2:** Define the unit of current.

**Question 3:** Calculate the number of electrons constituting one coulomb of charge.

**Question 4:** Name a device that helps to maintain a potential difference across a conductor.

**Question 5:** What is meant by saying that the potential difference between two points is 1 V?

**Question 6:** How much energy is given to each coulomb of charge passing through a 6 V battery?

**Question 7:** On what factors does the resistance of a conductor depend?

**Question 8:** Will current flow more easily through a thick wire or a thin wire of the same material, when connected to the same source? Why?

**Question 9:** Let the resistance of an electrical component remain constant while the potential difference across the two ends of the component decreases to half of its former value. What change will occur in the current through it?

**Question 10:** Why are coils of electric toasters and electric irons made of an alloy rather than a pure metal?

**Question 11:** Use the data in Table 12.2 to answer the following:
- (a) Which among iron and mercury is a better conductor?
- (b) Which material is the best conductor?

**Question 12:** Draw a schematic diagram of a circuit consisting of a battery of three cells of 2 V each, a 5 Ω resistor, an 8 Ω resistor, and a 12 Ω resistor, and a plug key, all connected in series.

**Question 13:** Redraw the circuit of Question 12, putting in an ammeter to measure the current through the resistors and a voltmeter to measure the potential difference across the 12 Ω resistor. What would be the readings in the ammeter and the voltmeter?

---

**End of Chapter 12**

*Continue learning with Chapter 13: Magnetic Effects of Electric Current*
