let abFilter = 25;
const width = window.innerWidth;
const height = window.innerHeight;

// chart positions based on the template

let depressionChartLeft = 0,
    depressionChartTop = 20;

let depressionChartMargin = { top: 40, right: 50, bottom: 100, left: 80 },
    depressionChartWidth =
        width - depressionChartMargin.left - depressionChartMargin.right,
    depressionChartHeight =
        350 - depressionChartMargin.top - depressionChartMargin.bottom;

// Since the course names are not clean
// ie. engi, engine, engineer, engineering all refer to the same catagory
// I asked chatgpt to create a map of catagories
// I used genai because I do not personally know all of the names and their representations
// For example I have no idea what 'fiqh fatwa' means
// I have put this disclosure into the canvas submission comment as well
// This was pasted with minor modifications as there's not really any way I can improve upon a map
// The professor said it's okay in class

const courseToCategoryMap = {
    // Islamic & Revealed Knowledge Studies
    "islamic education": "Islamic & Revealed Knowledge Studies",
    "pendidikan islam": "Islamic & Revealed Knowledge Studies", // Malay/Indonesian for Islamic Education
    usuluddin: "Islamic & Revealed Knowledge Studies",
    fiqh: "Islamic & Revealed Knowledge Studies",
    "fiqh fatwa": "Islamic & Revealed Knowledge Studies",
    irkhs: "Islamic & Revealed Knowledge Studies", // Kulliyyah of Islamic Revealed Knowledge and Human Sciences
    kirkhs: "Islamic & Revealed Knowledge Studies", // Same as IRKHS

    // Technology & Computer Science
    bit: "Technology & Computer Science", // Bachelor of Information Technology
    bcs: "Technology & Computer Science", // Bachelor of Computer Science
    it: "Technology & Computer Science",
    cts: "Technology & Computer Science", // Career & Technology Studies

    // Engineering
    engineering: "Engineering",
    engi: "Engineering",
    engie: "Engineering",
    eng: "Engineering",
    koe: "Engineering", // Likely Kulliyyah of Engineering

    // Health & Allied Sciences
    "diploma nursing": "Health & Allied Sciences",
    nursing: "Health & Allied Sciences",
    "biomedical science": "Health & Allied Sciences",
    radiography: "Health & Allied Sciences",
    mhsc: "Health & Allied Sciences", // Provisional: Assumed Master of Health Science. Review if different.

    // Economics, Business & Management Sciences
    kenms: "Economics, Business & Management Sciences", // Kulliyyah of Economics and Management Sciences
    accounting: "Economics, Business & Management Sciences",
    "banking studies": "Economics, Business & Management Sciences",
    "business administration": "Economics, Business & Management Sciences",
    econs: "Economics, Business & Management Sciences",

    // Human Sciences & Communication
    "human resources": "Human Sciences & Communication",
    "human sciences": "Human Sciences & Communication",
    psychology: "Human Sciences & Communication",
    communication: "Human Sciences & Communication",
    malcom: "Human Sciences & Communication", // Provisional: Assumed typo for "Communication" or related field. Review.

    // Language & Linguistics Studies
    taasl: "Language & Linguistics Studies", // Provisional: e.g., Teaching Arabic as a Second Language. Review.
    benl: "Language & Linguistics Studies", // Provisional: e.g., Bachelor of English Language. Review.
    "diploma tesl": "Language & Linguistics Studies", // Teaching English as a Second Language
    ala: "Language & Linguistics Studies", // Provisional: e.g., Associate in Liberal Arts or language-related. Review.

    // Specific/Corrected Fields
    law: "Law",
    mathemathics: "Mathematics", // Typo corrected to standard category name
    "marine science": "Marine Science",
    biotechnology: "Biotechnology",

    // Explicitly Uncategorized (due to ambiguity from previous analysis)
    enm: "Other", // Was ambiguous (Ethical Non-Monogamy in searches)
    kop: "Other", // Was ambiguous
};

console.log(courseToCategoryMap);

// plots
d3.csv("/data/Student Mental health.csv").then((rawData) => {
    console.log("rawData", rawData);

    // Clean course data to merge catagories, eg. laws and law to just law
    // Also create some helpful attributes for the plots
    const cleanedData = { ...rawData };

    for (let d of rawData) {
        d.cleanedCourse = d["What is your course?"].trim().toLowerCase();
        d.courseCatagory =
            d.cleanedCourse in courseToCategoryMap
                ? courseToCategoryMap[d.cleanedCourse]
                : "Other";

        d.hasDepression = d["Do you have Depression?"] === "Yes";
        d.gender = d["Choose your gender"];
        // Get just the number for year since the og data has manually typed out Year 1 or year 3
        d.year = parseInt(d["Your current year of Study"].match(/\d+/)[0]);
        d.age = d["Age"];

        d.hasAnxiety = d["Do you have Anxiety?"] === "Yes";
        d.hasPanicAttack = d["Do you have Panic attack?"] === "Yes";
    }

    console.log("cleaned", cleanedData);

    // Plot 1: Bar Chart for Depression Rate by Course

    // I was originally going to do a double bar chart
    // But I realized it's not a good fit for the data
    // As many courses don't have both male and female students
    // Since I already processed the data with these gender categories I will leave them
    const filteredDepressionData = rawData.map((d) => ({
        course: d.courseCatagory,
        hasDepression: d.hasDepression,
        gender: d.gender,
    }));

    const processedDepressionData = {};
    for (let d of filteredDepressionData) {
        // Make the course if not exists
        if (!Object.keys(processedDepressionData).includes(d.course)) {
            processedDepressionData[d.course] = {
                male: {
                    depressed: 0,
                    total: 0,
                    rate: undefined,
                },
                female: {
                    depressed: 0,
                    total: 0,
                    rate: undefined,
                },
                totalStudents: 0,
                totalDepressed: 0,
                totalRate: undefined,
            };
        }

        const course = processedDepressionData[d.course];

        const catagory = course[d.gender.toLowerCase()];

        if (d.hasDepression) {
            catagory.depressed += 1;
            course.totalDepressed += 1;
        }
        catagory.total += 1;
        catagory.rate = catagory.depressed / catagory.total;

        course.totalStudents += 1;
        course.totalRate = course.totalDepressed / course.totalStudents;
    }

    // Make array since d3 needs that, also sort by the rate
    const processedDepressionDataArray = Object.keys(processedDepressionData)
        .map((key) => ({
            course: key,
            ...processedDepressionData[key],
        }))
        .sort((a, b) => b.totalRate - a.totalRate);

    console.log(processedDepressionDataArray);

    // Make the plot
    const svg = d3.select("svg");

    const depressionBarChart = svg
        .append("g")
        .attr(
            "width",
            depressionChartWidth +
                depressionChartMargin.left +
                depressionChartMargin.right
        )
        .attr(
            "height",
            depressionChartHeight +
                depressionChartMargin.top +
                depressionChartMargin.bottom
        )
        .attr(
            "transform",
            `translate(${depressionChartMargin.left}, ${depressionChartMargin.top})`
        );

    // X label
    depressionBarChart
        .append("text")
        .attr("x", depressionChartWidth / 2)
        .attr("y", depressionChartHeight + 200)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Course Category");

    // Y label
    depressionBarChart
        .append("text")
        .attr("x", -(depressionChartHeight / 2))
        .attr("y", -40)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Depression Rate");

    // X ticks
    const depressionX = d3
        .scaleBand()
        .domain(processedDepressionDataArray.map((d) => d.course))
        .range([0, depressionChartWidth])
        .padding(0.1);

    const depressionXAxisCall = d3.axisBottom(depressionX);
    depressionBarChart
        .append("g")
        .attr("transform", `translate(0, ${depressionChartHeight})`)
        .call(depressionXAxisCall)
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)")
        .style("font-size", "12px");

    // Y ticks
    const depressionY = d3
        .scaleLinear()
        .domain([0, 100])
        .range([depressionChartHeight, 0]);

    const yAxisCall = d3
        .axisLeft(depressionY)
        .ticks(10)
        .tickFormat((d) => d + "%");
    depressionBarChart
        .append("g")
        .call(yAxisCall)
        .selectAll("text")
        .text((d) => d + "%");

    // Color based on red being bad and green being good
    const depressionColor = d3
        .scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateRgb("green", "red"));

    // Make the bars
    depressionBarChart
        .selectAll("rect")
        .data(processedDepressionDataArray)
        .join("rect")
        .attr("x", (d) => depressionX(d.course))
        .attr("y", (d) => depressionY(d.totalRate * 100))
        .attr("width", depressionX.bandwidth())
        .attr(
            "height",
            (d) => depressionChartHeight - depressionY(d.totalRate * 100)
        )
        .attr("fill", (d) => depressionColor(d.totalRate));

    // Title
    depressionBarChart
        .append("text")
        .attr("x", depressionChartWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Depression Rate by Course");

    // Make the legend
    // I also used chatgpt to help me understand how to make a gradiant
    const depressionLegendWidth = 100;
    const depressionLegendHeight = 20;

    const depressionLegend = depressionBarChart
        .append("g")
        .attr(
            "transform",
            `translate(${
                depressionChartWidth - depressionLegendWidth - 10
            },-20)`
        );

    // make it so the user can understand what the colors mean
    const gradient = depressionLegend
        .append("linearGradient")
        .attr("id", "depressionLegendGradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "green");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "red");

    depressionLegend
        .append("rect")
        .attr("width", depressionLegendWidth)
        .attr("height", depressionLegendHeight)
        .style("fill", "url(#depressionLegendGradient)");

    // put 0% on one side and 100% on the other
    depressionLegend
        .append("text")
        .attr("x", 0)
        .attr("y", depressionLegendHeight + 20)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .text("0%");

    depressionLegend
        .append("text")
        .attr("x", depressionLegendWidth)
        .attr("y", depressionLegendHeight + 20)
        .attr("text-anchor", "end")
        .style("font-size", "14px")
        .text("100%");

    // Plot 2: Chord diagram

    // I used https://d3-graph-gallery.com/graph/chord_colors.html as a template/guide

    // Represents connections between male, female, depression, anxiety, panic attack

    let chordChartLeft = 0,
        chordChartTop = height / 2;

    let chordChartMargin = { top: 50, right: 50, bottom: 50, left: 50 },
        chordChartWidth = width / 2,
        chordChartHeight = height / 2;

    const chordChart = svg
        .append("g")
        .attr("width", chordChartWidth)
        .attr("height", chordChartHeight)
        .attr("transform", `translate(${chordChartLeft}, ${chordChartTop})`);

    // Create matrix data for chord diagram
    // male, female, depression, anxiety, panic attack
    // just get the amount of students in each pair of categories
    // self to self is 0 and cannot be both male and female
    const matrix = [
        // male
        [
            0,
            0, // cannot be both male and female
            rawData.filter((d) => d.gender === "Male" && d.hasDepression)
                .length,
            rawData.filter((d) => d.gender === "Male" && d.hasAnxiety).length,
            rawData.filter((d) => d.gender === "Male" && d.hasPanicAttack)
                .length,
        ],

        // female
        [
            0,
            0,
            rawData.filter((d) => d.gender === "Female" && d.hasDepression)
                .length,
            rawData.filter((d) => d.gender === "Female" && d.hasAnxiety).length,
            rawData.filter((d) => d.gender === "Female" && d.hasPanicAttack)
                .length,
        ],

        // depression
        [
            rawData.filter((d) => d.gender === "Male" && d.hasDepression)
                .length,
            rawData.filter((d) => d.gender === "Female" && d.hasDepression)
                .length,
            0,
            rawData.filter((d) => d.hasAnxiety && d.hasDepression).length,
            rawData.filter((d) => d.hasDepression && d.hasPanicAttack).length,
        ],

        // anxiety
        [
            rawData.filter((d) => d.gender === "Male" && d.hasAnxiety).length,
            rawData.filter((d) => d.gender === "Female" && d.hasAnxiety).length,
            rawData.filter((d) => d.hasAnxiety && d.hasDepression).length,
            0,
            rawData.filter((d) => d.hasAnxiety && d.hasPanicAttack).length,
        ],

        // panic attack
        [
            rawData.filter((d) => d.gender === "Male" && d.hasPanicAttack)
                .length,
            rawData.filter((d) => d.gender === "Female" && d.hasPanicAttack)
                .length,
            rawData.filter((d) => d.hasDepression && d.hasPanicAttack).length,
            rawData.filter((d) => d.hasAnxiety && d.hasPanicAttack).length,
            0,
        ],
    ];

    console.log("matrix:", matrix);

    const chordInfo = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(
        matrix
    );

    const chordColors = d3.schemeTableau10;

    // Calculate responsive radius based on chart size
    const outerRadius = Math.min(chordChartWidth, chordChartHeight) * 0.35;
    const innerRadius = outerRadius - 10;

    // i pretty much just used the example from the link above
    // but also positioned it on the page
    // this part makes the rings on the outside
    chordChart
        .datum(chordInfo)
        .append("g")
        .selectAll("g")
        .data((d) => d.groups)
        .enter()
        .append("g")
        .append("path")
        .style("fill", function (d, i) {
            return chordColors[i];
        })
        .style("stroke", "black")
        .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .attr(
            "transform",
            `translate(${chordChartWidth / 2}, ${chordChartHeight / 2})`
        );

    // links
    chordChart
        .datum(chordInfo)
        .append("g")
        .selectAll("path")
        .data((d) => d)
        .enter()
        .append("path")
        .attr("d", d3.ribbon().radius(innerRadius))
        .style("fill", function (d) {
            return chordColors[d.source.index];
        })
        .style("stroke", "black")
        .attr(
            "transform",
            `translate(${chordChartWidth / 2}, ${chordChartHeight / 2})`
        );

    // Title
    chordChart
        .append("text")
        .attr("x", chordChartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Mental Health & Gender");

    // Legend
    const legendWidth = 150;
    const chordLegend = chordChart
        .append("g")
        .attr("transform", `translate(${chordChartWidth - legendWidth}, 0)`);

    const chordLegendNames = [
        "Male",
        "Female",
        "Has Depression",
        "Has Anxiety",
        "Has Panic Attack",
    ];

    const chordLegendEntries = chordLegend
        .selectAll("g")
        .data(chordLegendNames)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 22})`);

    chordLegendEntries
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", (d, i) => chordColors[i]);

    chordLegendEntries
        .append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text((d) => d)
        .style("font-size", 16);

    // rawData.forEach(function(d){
    //     d.AB = Number(d.AB);
    //     d.H = Number(d.H);
    //     d.salary = Number(d.salary);
    //     d.SO = Number(d.SO);
    // });

    // const filteredData = rawData.filter(d=>d.AB>abFilter);
    // const processedData = filteredData.map(d=>{
    //                       return {
    //                           "H_AB":d.H/d.AB,
    //                           "SO_AB":d.SO/d.AB,
    //                           "teamID":d.teamID,
    //                       };
    // });
    // console.log("processedData", processedData);

    // //plot 1: Scatter Plot
    // const svg = d3.select("svg");

    // const g1 = svg.append("g")
    //             .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
    //             .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
    //             .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // // X label
    // g1.append("text")
    // .attr("x", scatterWidth / 2)
    // .attr("y", scatterHeight + 50)
    // .attr("font-size", "20px")
    // .attr("text-anchor", "middle")
    // .text("H/AB");

    // // Y label
    // g1.append("text")
    // .attr("x", -(scatterHeight / 2))
    // .attr("y", -40)
    // .attr("font-size", "20px")
    // .attr("text-anchor", "middle")
    // .attr("transform", "rotate(-90)")
    // .text("SO/AB");

    // // X ticks
    // const x1 = d3.scaleLinear()
    // .domain([0, d3.max(processedData, d => d.H_AB)])
    // .range([0, scatterWidth]);

    // const xAxisCall = d3.axisBottom(x1)
    //                     .ticks(7);
    // g1.append("g")
    // .attr("transform", `translate(0, ${scatterHeight})`)
    // .call(xAxisCall)
    // .selectAll("text")
    //     .attr("y", "10")
    //     .attr("x", "-5")
    //     .attr("text-anchor", "end")
    //     .attr("transform", "rotate(-40)");

    // // Y ticks
    // const y1 = d3.scaleLinear()
    // .domain([0, d3.max(processedData, d => d.SO_AB)])
    // .range([scatterHeight, 0]);

    // const yAxisCall = d3.axisLeft(y1)
    //                     .ticks(13);
    // g1.append("g").call(yAxisCall);

    // // circles
    // const circles = g1.selectAll("circle").data(processedData);

    // circles.enter().append("circle")
    //      .attr("cx", d => x1(d.H_AB))
    //      .attr("cy", d => y1(d.SO_AB))
    //      .attr("r", 5)
    //      .attr("fill", "#69b3a2");

    // const g2 = svg.append("g")
    //             .attr("width", distrWidth + distrMargin.left + distrMargin.right)
    //             .attr("height", distrHeight + distrMargin.top + distrMargin.bottom)
    //             .attr("transform", `translate(${distrLeft}, ${distrTop})`);

    // //plot 2: Bar Chart for Team Player Count

    // const teamCounts = processedData.reduce((s, { teamID }) => (s[teamID] = (s[teamID] || 0) + 1, s), {});
    // const teamData = Object.keys(teamCounts).map((key) => ({ teamID: key, count: teamCounts[key] }));
    // console.log("teamData", teamData);

    // const g3 = svg.append("g")
    //             .attr("width", teamWidth + teamMargin.left + teamMargin.right)
    //             .attr("height", teamHeight + teamMargin.top + teamMargin.bottom)
    //             .attr("transform", `translate(${teamMargin.left}, ${teamTop})`);

    // // X label
    // g3.append("text")
    // .attr("x", teamWidth / 2)
    // .attr("y", teamHeight + 50)
    // .attr("font-size", "20px")
    // .attr("text-anchor", "middle")
    // .text("Team");

    // // Y label
    // g3.append("text")
    // .attr("x", -(teamHeight / 2))
    // .attr("y", -40)
    // .attr("font-size", "20px")
    // .attr("text-anchor", "middle")
    // .attr("transform", "rotate(-90)")
    // .text("Number of players");

    // // X ticks
    // const x2 = d3.scaleBand()
    // .domain(teamData.map(d => d.teamID))
    // .range([0, teamWidth])
    // .paddingInner(0.3)
    // .paddingOuter(0.2);

    // const xAxisCall2 = d3.axisBottom(x2);
    // g3.append("g")
    // .attr("transform", `translate(0, ${teamHeight})`)
    // .call(xAxisCall2)
    // .selectAll("text")
    //     .attr("y", "10")
    //     .attr("x", "-5")
    //     .attr("text-anchor", "end")
    //     .attr("transform", "rotate(-40)");

    // // Y ticks
    // const y2 = d3.scaleLinear()
    // .domain([0, d3.max(teamData, d => d.count)])
    // .range([teamHeight, 0])
    // .nice();

    // const yAxisCall2 = d3.axisLeft(y2)
    //                     .ticks(6);
    // g3.append("g").call(yAxisCall2);

    // // bars
    // const bars = g3.selectAll("rect").data(teamData);

    // bars.enter().append("rect")
    // .attr("y", d => y2(d.count))
    // .attr("x", d => x2(d.teamID))
    // .attr("width", x2.bandwidth())
    // .attr("height", d => teamHeight - y2(d.count))
    // .attr("fill", "steelblue");

    // }).catch(function(error){
    // console.log(error);
});
