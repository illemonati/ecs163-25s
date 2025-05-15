let abFilter = 25;
const width = window.innerWidth;
const height = window.innerHeight;

// chart positions based on the template

let depressionChartLeft = 0,
    depressionChartTop = 20;

let depressionChartMargin = { top: 40, right: 30, bottom: 60, left: 80 },
    depressionChartWidth =
        Math.floor(width / 3) -
        depressionChartMargin.left -
        depressionChartMargin.right,
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

// plots
d3.csv("data/Student Mental Health.csv").then((rawData) => {
    console.log("rawData", rawData);

    // Clean course data to merge catagories, eg. laws and law to just law

    const cleanedData = { ...rawData };

    for (let d of rawData) {
        d.cleanedCourse = d["What is your course?"].trim().toLowerCase();
        d.courseCatagory =
            d.cleanedCourse in courseToCategoryMap
                ? courseToCategoryMap[d.cleanedCourse]
                : "Other/Uncategorized";
    }

    // Plot 1: (Double?) Bar Chart for Depression Rate by Course and Gender
    // I think it's called Double Bar chart but basically its bar chart
    // But each catagory has 2 subcatagories
    // So 2 bars

    const filteredDepressionData = rawData.map((d) => ({
        course: d.courseCatagory,
        hasDepression: d["Do you have Depression?"] === "Yes",
        gender: d["Choose your gender"],
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
            };
        }

        const catagory =
            processedDepressionData[d.course][d.gender.toLowerCase()];

        if (d.hasDepression) {
            catagory.depressed += 1;
        }
        catagory.total += 1;
        catagory.rate = catagory.depressed / catagory.total;
    }

    console.log(processedDepressionData);

    // Make the plot
    const svg = d3.select("svg");

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
