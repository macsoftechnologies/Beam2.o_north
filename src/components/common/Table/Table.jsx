import React from "react";
import "./Table.css";
import Loader from "../Loader/Loader";

function buildPageList(current, total, delta = 1) {
  if (!total || total <= 0) return [];
  if (total === 1) return [1];

  const pages = new Set();
  pages.add(1);
  pages.add(total);

  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }

  return result;
}

const Table = ({
  columns = [],
  data = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  isLoading = false,
}) => {
  const pages = buildPageList(currentPage, totalPages);

  return (
    <div className="beam-table-wrapper">

      {/* ── Table Scroll Container ── */}
      <div className="beam-table-scroll">
        <table className="beam-table">

          {/* Header */}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className={`beam-th ${col.className || ""}`} style={col.style}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (

              <tr>
                <td colSpan={columns.length} className="beam-td-loader">
                  <Loader size="sm" text="Loading..." />
                </td>
              </tr>

            ) : data.length > 0 ? (

              data.map((row, index) => (
                <tr
                  key={index}
                  className={`beam-tr ${row._rowonClick ? "beam-tr--clickable" : ""}`}
                  onClick={row._rowonClick || undefined}
                >
                  {columns.map((col) => (
                    <td key={col.accessor} className={`beam-td ${col.className || ""}`} style={col.style}>
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))

            ) : (

              <tr>
                <td colSpan={columns.length} className="beam-td-empty">
                  <div className="beam-empty-state">
                    <span className="beam-empty-icon">⊘</span>
                    <p className="beam-empty-text">No Records Found</p>
                  </div>
                </td>
              </tr>

            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="beam-pagination">

          {/* Prev */}
          <button
            className="beam-page-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ←
          </button>

          {/* Page Numbers */}
          {pages.map((page, index) =>
            page === "..." ? (
              <span key={index} className="beam-page-dots">
                …
              </span>
            ) : (
              <button
                key={index}
                className={`beam-page-number ${currentPage === page ? "beam-page-number--active" : ""}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            className="beam-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            →
          </button>

        </div>
      )}

    </div>
  );
};

export default Table;