// Load the data from the JSON file
d3.json('data.json').then(data => createMap(data));

function createMap(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Prepare nodes and links from the data
  const nodes = Object.keys(data.genres).map(genre => ({ id: genre }));
  const links = [];

  Object.entries(data.genres).forEach(([genre, relatedGenres]) => {
    relatedGenres.forEach(related => {
      links.push({ source: genre, target: related });
    });
  });

  // Add nodes for artists
  Object.entries(data.artists).forEach(([genre, artists]) => {
    artists.forEach(artist => {
      nodes.push({ id: artist, group: genre });
      links.push({ source: genre, target: artist });
    });
  });

  // Draw links (lines)
  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");

  // Draw nodes (genre and artist names)
  const node = svg.append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text(d => d.id)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .call(drag(simulation));

  // Add forces to nodes and links
  simulation
    .nodes(nodes)
    .on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

  simulation.force("link").links(links);

  // Drag functionality
  function drag(simulation) {
    return d3.drag()
      .on("start", function(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }
}
