"use client"
import React, { useState, useRef, useEffect } from "react";

// Utility: convert number → Excel-like column name (A, B, C…)
const getColumnName = (num) => {
  let name = "";
  while (num >= 0) {
    name = String.fromCharCode((num % 26) + 65) + name;
    num = Math.floor(num / 26) - 1;
  }
  return name;
};

// Helper: create grid with row ids
const createGrid = (rows, cols) =>
  Array.from({ length: rows }, () => ({
    id: "row-" + Math.random().toString(36).slice(2),
    cells: Array(cols).fill(""),
  }));

const ExcelGrid = ({ rows = 20, cols = 7, initialData }) => {
  const [data, setData] = useState(
    initialData ||
      createGrid(rows, cols) // [{id, cells: []}, ...]
  );
  const [selected, setSelected] = useState({
    rowId: data[0].id,
    col: 0,
  });

  // filters & sort
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null);

  // refs for every cell
  const cellRefs = useRef({});

  // Autofocus selected cell
  useEffect(() => {
    const key = `${selected.rowId}-${selected.col}`;
    const el = cellRefs.current[key];
    if (el) el.focus();
  }, [selected]);

  // Update a cell
  const handleInputChange = (rowId, col, value) => {
    setData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, cells: row.cells.map((v, i) => (i === col ? value : v)) }
          : row
      )
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e, rowId, col, visibleRows) => {
    const rowIndex = visibleRows.findIndex((r) => r.id === rowId);
    let newRowIndex = rowIndex;
    let newCol = col;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      newRowIndex = Math.min(rowIndex + 1, visibleRows.length - 1);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      newRowIndex = Math.max(rowIndex - 1, 0);
    }
    if (e.key === "ArrowRight" || e.key === "Tab") {
      e.preventDefault();
      newCol = col + 1;
      if (newCol >= visibleRows[0].cells.length) {
        newCol = 0;
        newRowIndex = Math.min(rowIndex + 1, visibleRows.length - 1);
      }
    }
    if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      newCol = col - 1;
      if (newCol < 0) {
        newCol = visibleRows[0].cells.length - 1;
        newRowIndex = Math.max(rowIndex - 1, 0);
      }
    }

    setSelected({ rowId: visibleRows[newRowIndex].id, col: newCol });
  };

  // Insert row
  const insertRow = (rowId) => {
    const index = data.findIndex((r) => r.id === rowId);
    const newRow = {
      id: "row-" + Math.random().toString(36).slice(2),
      cells: Array(data[0].cells.length).fill(""),
    };
    const newData = [...data.slice(0, index), newRow, ...data.slice(index)];
    setData(newData);
  };

  // Insert column
  const insertCol = (col) => {
    setData((prev) =>
      prev.map((row) => ({
        ...row,
        cells: [...row.cells.slice(0, col), "", ...row.cells.slice(col)],
      }))
    );
  };

  // Filter
  const filteredData = data.filter((row) =>
    Object.entries(filters).every(([colIndex, filterVal]) =>
      filterVal
        ? row.cells[colIndex]
            .toString()
            .toLowerCase()
            .includes(filterVal.toLowerCase())
        : true
    )
  );

  // Sort
const sortedData = sort
  ? [...filteredData].sort((a, b) => {
      const valA = a.cells[sort.col];
      const valB = b.cells[sort.col];
      const direction = sort.dir === "asc" ? 1 : -1;

      // Try converting to numbers
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      // Check if both are valid, non-empty numbers
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        // Perform a numerical comparison
        return (numA - numB) * direction;
      } else {
        // Fallback to alphabetical comparison for text
        return valA.localeCompare(valB) * direction;
      }
    })
  : filteredData;

return (
  <div style={{ padding: "10px", fontFamily: "sans-serif" }}>
    <button onClick={() => insertRow(selected.rowId)}>Insert Row</button>
    <button onClick={() => insertCol(selected.col)}>Insert Column</button>

    <table style={{ borderCollapse: "collapse", marginTop: "10px" }}>
      <thead>
        <tr>
          <th></th>
          {data[0].cells.map((_, c) => (
            <th
              key={c}
              style={{
                border: "1px solid #ddd",
                background: selected.col === c ? "#e3f2fd" : "#f5f5f5",
                color: "#333",
              }}
            >
              {getColumnName(c)}
              <div>
                <input
                  placeholder="Filter"
                  style={{ 
                    width: "80%", 
                    fontSize: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    padding: "2px"
                  }}
                  value={filters[c] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, [c]: e.target.value })
                  }
                />
                <button
                  style={{ 
                    fontSize: "10px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    marginLeft: "2px"
                  }}
                  onClick={() =>
                    setSort(
                      sort?.col === c && sort.dir === "asc"
                        ? { col: c, dir: "desc" }
                        : { col: c, dir: "asc" }
                    )
                  }
                >
                  ↕
                </button>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, r) => (
          <tr key={row.id}>
            <td
              style={{
                border: "1px solid #ddd",
                background:
                  selected.rowId === row.id ? "#e8f5e8" : "#fafafa",
                textAlign: "center",
                color: "#666",
                fontWeight: "bold",
              }}
            >
              {r + 1}
            </td>
            {row.cells.map((cell, c) => {
              const key = `${row.id}-${c}`;
              return (
                <td key={c} style={{ border: "1px solid #ddd", padding: 0 }}>
                  <input
                    ref={(el) => (cellRefs.current[key] = el)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline:
                        selected.rowId === row.id && selected.col === c
                          ? "2px solid #2196f3"
                          : "none",
                      background: "transparent",
                      padding: "4px",
                    }}
                    value={cell}
                    onChange={(e) =>
                      handleInputChange(row.id, c, e.target.value)
                    }
                    onFocus={() => setSelected({ rowId: row.id, col: c })}
                    onKeyDown={(e) =>
                      handleKeyDown(e, row.id, c, sortedData)
                    }
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


};

export default ExcelGrid;
